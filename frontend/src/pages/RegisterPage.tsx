import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowRight,
  BadgePlus,
  LayoutDashboard,
  Megaphone,
  ShieldCheck,
} from "lucide-react";
import PageContainer from "../components/layout/PageContainer";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { api } from "../lib/api";

type RegisterForm = {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone_number: string;
  role: string;
  password: string;
  confirm_password: string;
  agree_terms: boolean;
};

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    defaultValues: {
      role: "buyer",
      phone_number: "",
      agree_terms: false,
    },
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api
      .post("/moderation/track-visitor/", {
        path: window.location.pathname,
      })
      .catch(() => {});
  }, []);

  const onSubmit = async (data: RegisterForm) => {
    console.log("SUBMIT FIRED", data);
    try {
      setError("");
      setSuccess("");

      const payload = {
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        username: data.username.trim(),
        email: data.email.trim().toLowerCase(),
        phone_number: data.phone_number?.trim() || "",
        role: data.role,
        password: data.password,
        confirm_password: data.confirm_password,
      };

      await api.post("/accounts/register/", payload);

      setSuccess("Account created successfully. You can now sign in.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err: any) {
      console.log("REGISTER ERROR:", err);
      console.log("REGISTER RESPONSE:", err?.response);
      console.log("REGISTER RESPONSE DATA:", err?.response?.data);
      console.log("REGISTER MESSAGE:", err?.message);

      const backend = err?.response?.data;

      if (backend?.email?.[0]) {
        setError(backend.email[0]);
      } else if (backend?.username?.[0]) {
        setError(backend.username[0]);
      } else if (backend?.first_name?.[0]) {
        setError(backend.first_name[0]);
      } else if (backend?.last_name?.[0]) {
        setError(backend.last_name[0]);
      } else if (backend?.phone_number?.[0]) {
        setError(backend.phone_number[0]);
      } else if (backend?.role?.[0]) {
        setError(backend.role[0]);
      } else if (backend?.password?.[0]) {
        setError(backend.password[0]);
      } else if (backend?.confirm_password?.[0]) {
        setError(backend.confirm_password[0]);
      } else if (backend?.non_field_errors?.[0]) {
        setError(backend.non_field_errors[0]);
      } else if (backend?.detail) {
        setError(backend.detail);
      } else if (typeof backend === "string") {
        setError(backend);
      } else if (Array.isArray(backend)) {
        setError(backend.join(", "));
      } else if (backend && typeof backend === "object") {
        // setError(JSON.stringify(backend));
        setError(`BACKEND: ${JSON.stringify(backend)}`);
      } else if (err?.message) {
        // setError(err.message);
        setError(`ERRMSG: ${err.message}`);
      } else {
        setError("Registration failed again 1111. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-8 md:py-12">
      <PageContainer>
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.15fr_0.95fr] lg:items-center">
          <div className="order-2 lg:order-1">
            <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-8 shadow-xl backdrop-blur md:p-10">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <BadgePlus size={28} />
              </div>

              <h1 className="max-w-xl text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
                Create your account
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                Join the platform to post listings, manage your properties or
                ads, and connect with buyers, renters, and businesses.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/listings">
                  <Button className="flex w-full items-center justify-center gap-2 sm:w-auto">
                    Browse Listings
                    <ArrowRight size={16} />
                  </Button>
                </Link>

                <Link to="/login">
                  <Button
                    variant="outline"
                    className="flex w-full items-center justify-center gap-2 sm:w-auto"
                  >
                    Already have an account?
                  </Button>
                </Link>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Megaphone size={20} />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">Post easily</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Add your property, car, or business details in minutes.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <ShieldCheck size={20} />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">Reach users</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Get visibility for your listings and promotions.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm sm:col-span-2 xl:col-span-1">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <LayoutDashboard size={20} />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">Manage faster</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Track and update your listings from one place.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <Card className="rounded-[2rem] border border-slate-200 p-6 shadow-xl md:p-8">
              <h2 className="text-3xl font-bold text-slate-900">Sign up</h2>
              <p className="mt-2 text-sm text-slate-500">
                Fill in your details to get started.
              </p>

              <form className="mt-8 grid gap-4" onSubmit={handleSubmit(onSubmit)}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Input
                      placeholder="First name"
                      {...register("first_name", {
                        required: "First name is required",
                      })}
                    />
                    {errors.first_name && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.first_name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Input
                      placeholder="Last name"
                      {...register("last_name", {
                        required: "Last name is required",
                      })}
                    />
                    {errors.last_name && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.last_name.message}
                      </p>
                    )}
                  </div>
                </div>

                <Input
                  type="email"
                  placeholder="Email address"
                  {...register("email", {
                    required: "Email is required",
                  })}
                />
                {errors.email && (
                  <p className="-mt-2 text-sm text-red-600">{errors.email.message}</p>
                )}

                <Input
                  placeholder="Username"
                  {...register("username", {
                    required: "Username is required",
                  })}
                />
                {errors.username && (
                  <p className="-mt-2 text-sm text-red-600">{errors.username.message}</p>
                )}

                <Input
                  placeholder="Phone number (optional)"
                  {...register("phone_number")}
                />
                {errors.phone_number && (
                  <p className="-mt-2 text-sm text-red-600">
                    {errors.phone_number.message}
                  </p>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Account type
                  </label>
                  <select
                    {...register("role", {
                      required: "Account type is required",
                    })}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-slate-500"
                  >
                    <option value="buyer">Buyer</option>
                    <option value="seller">Seller</option>
                  </select>
                  {errors.role && (
                    <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                  )}
                </div>

                <Input
                  type="password"
                  placeholder="Password"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters",
                    },
                  })}
                />
                {errors.password && (
                  <p className="-mt-2 text-sm text-red-600">{errors.password.message}</p>
                )}

                <Input
                  type="password"
                  placeholder="Confirm password"
                  {...register("confirm_password", {
                    required: "Please confirm your password",
                    validate: (value) =>
                      value === watch("password") || "Passwords do not match",
                  })}
                />
                {errors.confirm_password && (
                  <p className="-mt-2 text-sm text-red-600">
                    {errors.confirm_password.message}
                  </p>
                )}

                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded"
                    {...register("agree_terms", {
                      required: "You must agree to the terms and privacy policy",
                    })}
                  />
                  <span className="text-sm leading-6 text-slate-700">
                    I agree to the{" "}
                    <Link
                      to="/terms"
                      className="font-medium text-indigo-600 hover:underline"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      to="/privacy"
                      className="font-medium text-indigo-600 hover:underline"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>
                {errors.agree_terms && (
                  <p className="-mt-2 text-sm text-red-600">
                    {errors.agree_terms.message}
                  </p>
                )}

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 break-words whitespace-pre-wrap">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {success}
                  </div>
                )}

                {/* <Button type="submit" className="mt-2 w-full py-3 text-base">
                  Create account
                </Button> */}

<button
  type="submit"
  className="mt-2 w-full rounded-2xl bg-slate-900 px-4 py-3 text-base font-medium text-white hover:bg-slate-800"
>
  Create account
</button>


              </form>

              <div className="mt-6 text-center text-sm text-slate-500">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-medium text-indigo-600 hover:underline"
                >
                  Login
                </Link>
              </div>

              <div className="mt-4 text-center">
                <Link
                  to="/listings"
                  className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  Continue to listings
                  <ArrowRight size={16} />
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}