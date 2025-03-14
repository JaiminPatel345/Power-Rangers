import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

const credentialsSchema = z.object({
  instituteCode: z.string().min(1, "Institute code is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type CredentialsValues = z.infer<typeof credentialsSchema>;

export default function AdminLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<CredentialsValues>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: {
      instituteCode: "",
      password: "",
    },
  });

  const onSubmit = async (values: CredentialsValues) => {
    try {
      setIsLoading(true);
      await apiRequest(
        "POST",
        isRegistering ? "/api/admin/register" : "/api/admin/login",
        values
      );
      toast({
        title: isRegistering ? "Registration successful" : "Login successful",
        description: isRegistering
          ? "You can now log in with your credentials"
          : "Welcome back!",
      });
      if (!isRegistering) {
        setLocation("/admin/dashboard");
      } else {
        setIsRegistering(false);
      }
    } catch (error) {
      toast({
        title: isRegistering ? "Registration failed" : "Login failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-muted/50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>{isRegistering ? "Institute Registration" : "Institute Admin Login"}</CardTitle>
          <CardDescription>
            {isRegistering
              ? "Register your institute to manage branch information and cutoff data"
              : "Login to manage your institute's information"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instituteCode">Institute Code</Label>
              <Input
                id="instituteCode"
                {...form.register("instituteCode")}
                disabled={isLoading}
              />
              {form.formState.errors.instituteCode && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.instituteCode.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...form.register("password")}
                disabled={isLoading}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading
                ? isRegistering
                  ? "Registering..."
                  : "Logging in..."
                : isRegistering
                ? "Register"
                : "Login"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setIsRegistering(!isRegistering)}
              disabled={isLoading}
            >
              {isRegistering
                ? "Already have an account? Login"
                : "Need to register? Create Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}