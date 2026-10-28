import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Page } from "../components/layout/Page";
import { Stack } from "../components/layout/Stack";
import { PageHeader } from "../components/layout/PageHeader";
import { LoginForm } from "../components/auth/LoginForm";
import { useIsAuthenticated } from "../auth/hooks";
import { safeNext } from "../auth/redirect";

export function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAuth = useIsAuthenticated();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));

  useEffect(() => {
    if (isAuth) navigate(next, { replace: true });
  }, [isAuth, navigate, next]);

  return (
    <Page size="sm">
      <Stack gap="lg">
        <PageHeader title={t("auth.signIn")} />
        <LoginForm next={next} onSuccess={() => navigate(next, { replace: true })} />
      </Stack>
    </Page>
  );
}
