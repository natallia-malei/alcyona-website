import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Page } from "../components/layout/Page";
import { Stack } from "../components/layout/Stack";
import { PageHeader } from "../components/layout/PageHeader";
import { LoginForm } from "../components/auth/LoginForm";
import { useAuthActions, useIsAuthenticated } from "../auth/hooks";

export function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAuth = useIsAuthenticated();
  const { signIn } = useAuthActions();

  useEffect(() => {
    if (isAuth) navigate("/", { replace: true });
  }, [isAuth, navigate]);

  return (
    <Page size="sm">
      <Stack gap="lg">
        <PageHeader title={t("auth.signIn")} />
        <LoginForm onSubmit={signIn} onSuccess={() => navigate("/", { replace: true })} />
      </Stack>
    </Page>
  );
}
