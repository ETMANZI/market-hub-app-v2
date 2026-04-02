import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ShieldCheck,
  UserRound,
  KeyRound,
  Mail,
  LayoutDashboard,
} from "lucide-react";
import PageContainer from "../components/layout/PageContainer";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { api } from "../lib/api";

type CurrentUser = {
  id: string | number;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
};

export default function ProfilePage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<CurrentUser>({
    queryKey: ["profile-me"],
    queryFn: async () => (await api.get("/accounts/me/")).data,
  });

  const [form, setForm] = useState({
    username: "",
    first_name: "",
    last_name: "",
    phone_number: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (data) {
      setForm({
        username: data.username || "",
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        phone_number: data.phone_number || "",
      });
    }
  }, [data]);

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      setProfileMessage("");
      setProfileError("");

      return await api.patch("/accounts/me/", {
        username: form.username,
        first_name: form.first_name,
        last_name: form.last_name,
        phone_number: form.phone_number,
      });
    },
    onSuccess: async () => {
      setProfileMessage("Profile updated successfully.");
      await queryClient.invalidateQueries({ queryKey: ["profile-me"] });
      await queryClient.invalidateQueries({ queryKey: ["navbar-current-user"] });
    },
    onError: (error: any) => {
      const errors = error?.response?.data;
      if (errors?.username?.[0]) {
        setProfileError(errors.username[0]);
      } else if (errors?.first_name?.[0]) {
        setProfileError(errors.first_name[0]);
      } else if (errors?.last_name?.[0]) {
        setProfileError(errors.last_name[0]);
      } else if (errors?.phone_number?.[0]) {
        setProfileError(errors.phone_number[0]);
      } else {
        setProfileError("Failed to update profile.");
      }
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      setPasswordMessage("");
      setPasswordError("");
      return await api.post("/accounts/change-password/", passwordForm);
    },
    onSuccess: () => {
      setPasswordMessage("Password changed successfully.");
      setPasswordForm({
        old_password: "",
        new_password: "",
        confirm_password: "",
      });
    },
    onError: (error: any) => {
      const errors = error?.response?.data;
      if (errors?.old_password?.[0]) {
        setPasswordError(errors.old_password[0]);
      } else if (errors?.confirm_password?.[0]) {
        setPasswordError(errors.confirm_password[0]);
      } else if (errors?.new_password?.[0]) {
        setPasswordError(errors.new_password[0]);
      } else if (errors?.non_field_errors?.[0]) {
        setPasswordError(errors.non_field_errors[0]);
      } else {
        setPasswordError("Failed to change password.");
      }
    },
  });

  const displayName =
    [data?.first_name, data?.last_name].filter(Boolean).join(" ").trim() ||
    data?.username ||
    "My Profile";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <PageContainer>
          <div className="py-16 text-center text-slate-500">Loading...</div>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-8 md:py-12">
      <PageContainer>
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.05fr_1fr] lg:items-start">
          <div>
            <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-8 shadow-xl backdrop-blur md:p-10">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <UserRound size={28} />
              </div>

              <h1 className="max-w-xl text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
                Manage your account
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                Keep your profile details up to date and secure your account with
                a strong password.
              </p>

              <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Signed in as</p>
                    <h2 className="mt-1 text-xl font-semibold text-slate-900">
                      {displayName}
                    </h2>
                    <p className="mt-1 break-all text-sm text-slate-600">
                      {data?.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/dashboard">
                  <Button className="flex w-full items-center justify-center gap-2 sm:w-auto">
                    Dashboard
                    <ArrowRight size={16} />
                  </Button>
                </Link>

                <Link to="/listings">
                  <Button
                    variant="outline"
                    className="flex w-full items-center justify-center gap-2 sm:w-auto"
                  >
                    Browse Listings
                  </Button>
                </Link>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <UserRound size={20} />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Update details
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Edit your username, first name, last name, and phone number.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <KeyRound size={20} />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Change password
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Protect your account by setting a stronger password anytime.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm sm:col-span-2 xl:col-span-1">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <ShieldCheck size={20} />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Stay secure
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Your email stays protected and cannot be changed from here.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="rounded-[2rem] border border-slate-200 p-6 shadow-xl md:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <LayoutDashboard size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Profile Details</h2>
                  <p className="text-sm text-slate-500">
                    Update your personal information below.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <Input
                    value={data?.email || ""}
                    disabled
                    className="cursor-not-allowed bg-slate-100 text-slate-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Username
                  </label>
                  <Input
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="Username"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Phone Number
                  </label>
                  <Input
                    value={form.phone_number}
                    onChange={(e) =>
                      setForm({ ...form, phone_number: e.target.value })
                    }
                    placeholder="Phone number (optional)"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    First Name
                  </label>
                  <Input
                    value={form.first_name}
                    onChange={(e) =>
                      setForm({ ...form, first_name: e.target.value })
                    }
                    placeholder="First name"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Last Name
                  </label>
                  <Input
                    value={form.last_name}
                    onChange={(e) =>
                      setForm({ ...form, last_name: e.target.value })
                    }
                    placeholder="Last name"
                  />
                </div>
              </div>

              {profileError && (
                <p className="mt-4 text-sm text-red-600">{profileError}</p>
              )}
              {profileMessage && (
                <p className="mt-4 text-sm text-green-600">{profileMessage}</p>
              )}

              <Button
                onClick={() => updateProfileMutation.mutate()}
                disabled={updateProfileMutation.isPending}
                className="mt-6 w-full md:w-auto"
              >
                {updateProfileMutation.isPending ? "Saving..." : "Update Profile"}
              </Button>
            </Card>

            <Card className="rounded-[2rem] border border-slate-200 p-6 shadow-xl md:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Change Password</h2>
                  <p className="text-sm text-slate-500">
                    Use your current password to set a new one.
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Old Password
                  </label>
                  <Input
                    type="password"
                    value={passwordForm.old_password}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        old_password: e.target.value,
                      })
                    }
                    placeholder="Old password"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    New Password
                  </label>
                  <Input
                    type="password"
                    value={passwordForm.new_password}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        new_password: e.target.value,
                      })
                    }
                    placeholder="New password"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    value={passwordForm.confirm_password}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirm_password: e.target.value,
                      })
                    }
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              {passwordError && (
                <p className="mt-4 text-sm text-red-600">{passwordError}</p>
              )}
              {passwordMessage && (
                <p className="mt-4 text-sm text-green-600">{passwordMessage}</p>
              )}

              <Button
                onClick={() => changePasswordMutation.mutate()}
                disabled={changePasswordMutation.isPending}
                className="mt-6 w-full md:w-auto"
              >
                {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
              </Button>
            </Card>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}