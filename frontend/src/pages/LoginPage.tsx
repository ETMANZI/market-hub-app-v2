import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import PageContainer from "../components/layout/PageContainer";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { api } from "../lib/api";
import { saveTokens } from "../lib/auth";
import { ArrowRight } from "lucide-react";

type LoginForm = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const { register, handleSubmit } = useForm<LoginForm>();
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.post("/moderation/track-visitor/", {
      path: window.location.pathname,
    }).catch(() => {});
  }, []);

  const onSubmit = async (data: LoginForm) => {
    try {
      setError("");
      const response = await api.post("/accounts/login/", data);
      saveTokens(response.data.access, response.data.refresh);
      navigate("/listings");
    } catch (err: any) {
      const backendMessage =
        err?.response?.data?.detail ||
        err?.response?.data?.non_field_errors?.[0] ||
        err?.response?.data?.message ||
        "Invalid email or password.";

      setError(backendMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center">
      <PageContainer>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2">
          <div className="flex flex-col justify-center space-y-6 px-2">
            <h1 className="text-4xl font-bold text-slate-800">
              Welcome back 👋
            </h1>
            <p className="text-slate-500">
              Sign in to manage your listings, post ads, and explore opportunities.
            </p>

            <Link to="/listings">
              <Button variant="outline" className="flex items-center gap-2">
                Browse Listings
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>

          <div>
            <Card className="p-6 shadow-lg">
              <h2 className="mb-6 text-2xl font-semibold text-slate-800">
                Login to your account
              </h2>

              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                <Input placeholder="Email" {...register("email")} />
                <Input
                  type="password"
                  placeholder="Password"
                  {...register("password")}
                />

                <div className="text-right">
                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-indigo-600 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <Button type="submit" className="w-full">
                  Sign in
                </Button>
              </form>

              <div className="mt-4 text-center text-sm text-slate-500">
                Don’t have an account?{" "}
                <Link
                  to="/register"
                  className="font-medium text-indigo-600 hover:underline"
                >
                  Sign up
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}