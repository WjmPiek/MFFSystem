from __future__ import annotations

import io
import re
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from typing import Iterable

import pdfplumber
from pypdf import PdfReader


DATE_PATTERN = re.compile(
    r"\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2}|\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4})\b"
)
AMOUNT_PATTERN = re.compile(
    r"(?<!\d)(?:R\s*)?[+-]?(?:\d{1,3}(?:[ ,]\d{3})+|\d+)(?:[.,]\d{2})?(?:\s?(?:CR|DR))?(?!\d)",
    re.IGNORECASE,
)
REFERENCE_PATTERN = re.compile(
    r"\b(?:ref(?:erence)?[:\s-]*)?([A-Z0-9][A-Z0-9\-/.]{4,})\b",
    re.IGNORECASE,
)
SKIP_LINE_PATTERN = re.compile(
    r"opening balance|closing balance|balance brought forward|page \d+|statement period|account number|branch code|available balance|total charges|summary",
    re.IGNORECASE,
)
DEBIT_HINT_PATTERN = re.compile(
    r"\b(debit|dr\b|fee|charge|withdrawal|purchase|debit order|cash withdrawal|atm|transfer to|airtime|electricity)\b",
    re.IGNORECASE,
)
CREDIT_HINT_PATTERN = re.compile(
    r"\b(credit|cr\b|deposit|payment|paid|salary|cash dep|transfer from|received|immediate payment)\b",
    re.IGNORECASE,
)
NAME_STOPWORDS = re.compile(
    r"\b(?:payment|deposit|transfer|received|credit|cash|immediate|eft|atm|ref|reference|from|by|via|trf)\b",
    re.IGNORECASE,
)


@dataclass
class ParsedTransaction:
    payer_name: str
    reference: str
    amount: float
    franchise_name: str | None = None
    notes: str | None = None

    def to_dict(self):
        return {
            "payer_name": self.payer_name,
            "reference": self.reference,
            "amount": self.amount,
            "franchise_name": self.franchise_name,
            "notes": self.notes,
        }


class StatementParseError(ValueError):
    pass


class StatementParser:
    def parse_pdf(self, pdf_bytes: bytes, franchise_name: str | None = None) -> list[dict]:
        if not pdf_bytes:
            raise StatementParseError("The uploaded PDF is empty.")

        lines = self._extract_candidate_lines(pdf_bytes)
        transactions = self._parse_lines(lines, franchise_name)
        if not transactions:
            raise StatementParseError(
                "No payment transactions could be extracted from this PDF. Use a text-based bank statement PDF with visible transaction rows."
            )
        return [transaction.to_dict() for transaction in transactions]

    def _extract_candidate_lines(self, pdf_bytes: bytes) -> list[str]:
        candidates: list[str] = []

        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                text = page.extract_text(x_tolerance=2, y_tolerance=2) or ""
                candidates.extend(self._split_text_to_lines(text))
                for table in page.extract_tables() or []:
                    for row in table:
                        cells = [self._clean_cell(cell) for cell in row or [] if self._clean_cell(cell)]
                        if cells:
                            candidates.append(" ".join(cells))

        if not candidates:
            reader = PdfReader(io.BytesIO(pdf_bytes))
            for page in reader.pages:
                text = page.extract_text() or ""
                candidates.extend(self._split_text_to_lines(text))

        deduped: list[str] = []
        seen: set[str] = set()
        for raw_line in candidates:
            line = self._normalise_line(raw_line)
            if not line or line in seen:
                continue
            seen.add(line)
            deduped.append(line)
        return deduped

    def _split_text_to_lines(self, text: str) -> list[str]:
        return [line.strip() for line in text.splitlines() if line.strip()]

    def _clean_cell(self, value: object) -> str:
        if value is None:
            return ""
        return str(value).replace("\n", " ").strip()

    def _normalise_line(self, line: str) -> str:
        line = line.replace("\xa0", " ")
        line = re.sub(r"\s+", " ", line).strip(" |\t")
        return line

    def _parse_lines(self, lines: Iterable[str], franchise_name: str | None) -> list[ParsedTransaction]:
        results: list[ParsedTransaction] = []
        seen_keys: set[tuple[str, str, str]] = set()

        for line in lines:
            if not DATE_PATTERN.search(line):
                continue
            if SKIP_LINE_PATTERN.search(line):
                continue

            parsed = self._parse_line(line, franchise_name)
            if not parsed:
                continue

            key = (parsed.reference.lower(), f"{parsed.amount:.2f}", parsed.payer_name.lower())
            if key in seen_keys:
                continue
            seen_keys.add(key)
            results.append(parsed)

        return results

    def _parse_line(self, line: str, franchise_name: str | None) -> ParsedTransaction | None:
        amount_matches = list(AMOUNT_PATTERN.finditer(line))
        if not amount_matches:
            return None

        amount_match = self._pick_amount_match(amount_matches, line)
        amount = self._parse_amount(amount_match.group(0))
        if amount is None or amount <= 0:
            return None

        if self._looks_like_debit(line, amount_match.group(0)):
            return None

        description = self._extract_description(line, amount_match)
        if not description or len(description) < 3:
            return None

        reference = self._extract_reference(description)
        payer_name = self._extract_payer_name(description, reference)
        if not payer_name:
            payer_name = reference or "Unknown payer"
        if not reference:
            reference = self._make_reference_from_text(description, amount)

        return ParsedTransaction(
            payer_name=payer_name[:255],
            reference=reference[:120],
            amount=float(amount),
            franchise_name=franchise_name,
            notes=f"Imported from PDF statement row: {line[:300]}",
        )

    def _pick_amount_match(self, matches: list[re.Match], line: str) -> re.Match:
        if len(matches) == 1:
            return matches[0]

        line_lower = line.lower()
        has_balance_word = "balance" in line_lower
        if has_balance_word and len(matches) >= 2:
            return matches[-2]

        preferred = [m for m in matches if re.search(r"\b(?:cr|credit)\b", m.group(0), re.IGNORECASE)]
        if preferred:
            return preferred[-1]

        return matches[-1] if len(matches) == 2 else matches[-2]

    def _parse_amount(self, raw_amount: str) -> Decimal | None:
        cleaned = raw_amount.upper().replace("R", "").replace(" ", "")
        sign = Decimal("-1") if cleaned.endswith("DR") or cleaned.startswith("-") else Decimal("1")
        cleaned = cleaned.replace("CR", "").replace("DR", "")

        if "," in cleaned and "." in cleaned:
            cleaned = cleaned.replace(",", "")
        elif cleaned.count(",") == 1 and "." not in cleaned:
            cleaned = cleaned.replace(",", ".")
        else:
            cleaned = cleaned.replace(",", "")

        try:
            value = Decimal(cleaned)
        except InvalidOperation:
            return None
        return value * sign

    def _looks_like_debit(self, line: str, amount_token: str) -> bool:
        if amount_token.strip().upper().endswith("DR") or amount_token.strip().startswith("-"):
            return True
        if DEBIT_HINT_PATTERN.search(line) and not CREDIT_HINT_PATTERN.search(line):
            return True
        return False

    def _extract_description(self, line: str, amount_match: re.Match) -> str:
        description = DATE_PATTERN.sub(" ", line)
        amount_token = re.escape(amount_match.group(0).strip())
        description = re.sub(rf"{amount_token}(?:\s+(?:R\s*)?[+-]?(?:\d{{1,3}}(?:[ ,]\d{{3}})+|\d+)(?:[.,]\d{{2}})?(?:\s?(?:CR|DR))?)?$", " ", description, flags=re.IGNORECASE)
        description = re.sub(r"\b(?:balance|credit|debit)\b.*$", " ", description, flags=re.IGNORECASE)
        description = re.sub(r"\s+", " ", description).strip(" -|")
        return description

    def _extract_reference(self, description: str) -> str:
        matches = [m.group(1) for m in REFERENCE_PATTERN.finditer(description)]
        if not matches:
            return ""
        matches.sort(key=len, reverse=True)
        return matches[0].upper()

    def _extract_payer_name(self, description: str, reference: str) -> str:
        payer = description
        if reference:
            payer = re.sub(re.escape(reference), " ", payer, flags=re.IGNORECASE)
        payer = NAME_STOPWORDS.sub(" ", payer)
        payer = re.sub(r"[^A-Za-z0-9&./\- ]", " ", payer)
        payer = re.sub(r"\s+", " ", payer).strip(" -/")
        return payer.title()

    def _make_reference_from_text(self, description: str, amount: Decimal) -> str:
        compact = re.sub(r"[^A-Za-z0-9]", "", description.upper())
        compact = compact[:8] or "PAYMENT"
        return f"{compact}-{int(amount * 100)}"
