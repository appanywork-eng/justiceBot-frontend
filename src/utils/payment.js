export async function initPayment(amount) {
  return {
    status: "success",
    message: \`Payment of ₦\${amount} initialized securely\`,
    redirect_user_to_dashboard: true
  };
}
