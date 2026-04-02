import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageContainer from "../components/layout/PageContainer";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { api } from "../lib/api";

export default function ResetPasswordPage() {
  const { uid, token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await api.post("/accounts/reset-password-confirm/", {
        uid,
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setMessage(res.data.message);
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err: any) {
      const data = err?.response?.data;
      setError(
        data?.error ||
          data?.confirm_password?.[0] ||
          data?.new_password?.[0] ||
          "Failed to reset password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center">
      <PageContainer>
        <div className="mx-auto max-w-md">
          <Card className="p-6 shadow-lg">
            <h1 className="mb-2 text-2xl font-semibold text-slate-800">
              Reset Password
            </h1>
            <p className="mb-6 text-sm text-slate-500">
              Enter your new password below.
            </p>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              {error && <p className="text-sm text-red-600">{error}</p>}
              {message && <p className="text-sm text-green-600">{message}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-slate-500">
              <Link
                to="/login"
                className="font-medium text-indigo-600 hover:underline"
              >
                Back to login
              </Link>
            </div>
          </Card>
        </div>
      </PageContainer>
    </div>
  );
}