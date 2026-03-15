if (user.role === "admin") {
  showAdminDashboard();
}

if (user.role === "franchisee" || user.role === "admin") {
  showUploadBankStatements();
}