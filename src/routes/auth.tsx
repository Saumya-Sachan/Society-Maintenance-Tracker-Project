import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

type Search = { mode?: "signin" | "signup" | "forgot" };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    mode: s.mode === "signup" || s.mode === "forgot" ? s.mode : "signin",
  }),
  head: () => ({
    meta: [{ title: "Sign in — Society Maintenance Tracker" }, { name: "description", content: "Sign in or register to manage your society maintenance." }],
  }),
  component: AuthPage,
});

const signUpSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().min(6, "Enter a valid phone number").max(20),
  flat_number: z.string().trim().min(1, "Flat number is required").max(20),
  block: z.string().trim().min(1, "Block / tower is required").max(50),
  password: z.string().min(8, "At least 8 characters").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const { mode } = Route.useSearch();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden lg:block" style={{ background: "var(--gradient-hero)" }}>
        <div className="pointer-events-none absolute inset-0 opacity-25"
          style={{ backgroundImage: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent 50%)" }} />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold">Society Tracker</span>
          </Link>
          <div>
            <blockquote className="text-2xl font-medium leading-snug">
              "Every complaint tracked. Every resolution logged. A community that trusts its process."
            </blockquote>
            <p className="mt-6 text-sm text-white/80">Society Maintenance Tracker</p>
          </div>
        </div>
      </aside>

      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>

          {mode === "forgot" ? <ForgotForm /> : (
            <Tabs value={mode} onValueChange={(v) => navigate({ to: "/auth", search: { mode: v as Search["mode"] } })}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>
              <TabsContent value="signin"><SignInForm /></TabsContent>
              <TabsContent value="signup"><SignUpForm /></TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}

function SignInForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Welcome back");
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <Card className="mt-6 border-border">
      <CardHeader>
        <CardTitle>Sign in to your account</CardTitle>
        <CardDescription>Access your society maintenance dashboard.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signin-email">Email</Label>
            <Input id="signin-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="signin-password">Password</Label>
              <Link to="/auth" search={{ mode: "forgot" }} className="text-xs text-secondary hover:underline">Forgot password?</Link>
            </div>
            <Input id="signin-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sign in
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function SignUpForm() {
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", flat_number: "", block: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signUpSchema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: parsed.data.full_name,
          phone: parsed.data.phone,
          flat_number: parsed.data.flat_number,
          block: parsed.data.block,
        },
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setDone(true);
    toast.success("Account created — check your email if confirmation is required.");
  };

  if (done) {
    return (
      <Card className="mt-6 border-border">
        <CardHeader>
          <CardTitle>Almost there</CardTitle>
          <CardDescription>
            We've created your account. If email confirmation is required for this society, please verify from your inbox before signing in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full"><Link to="/auth">Continue to sign in</Link></Button>
        </CardContent>
      </Card>
    );
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Card className="mt-6 border-border">
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Register with your flat details to raise and track complaints.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signup-name">Full name</Label>
            <Input id="signup-name" required value={form.full_name} onChange={set("full_name")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="signup-block">Block / Tower</Label>
              <Input id="signup-block" required placeholder="A" value={form.block} onChange={set("block")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-flat">Flat number</Label>
              <Input id="signup-flat" required placeholder="1204" value={form.flat_number} onChange={set("flat_number")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-email">Email</Label>
            <Input id="signup-email" type="email" required value={form.email} onChange={set("email")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-phone">Phone number</Label>
            <Input id="signup-phone" required value={form.phone} onChange={set("phone")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-password">Password</Label>
            <Input id="signup-password" type="password" required minLength={8} value={form.password} onChange={set("password")} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create account
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ForgotForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
  };

  return (
    <Card className="mt-6 border-border">
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>We'll email you a secure link to set a new password.</CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="space-y-4">
            <p className="rounded-lg bg-success/10 p-3 text-sm text-success">
              If an account exists for <strong>{email}</strong>, a reset link is on its way.
            </p>
            <Button asChild variant="outline" className="w-full"><Link to="/auth">Back to sign in</Link></Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email</Label>
              <Input id="forgot-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Send reset link
            </Button>
            <Button type="button" variant="ghost" asChild className="w-full">
              <Link to="/auth">Back to sign in</Link>
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
