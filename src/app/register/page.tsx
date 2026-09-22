import { AuthForm } from "@/components/auth-form";
import { PageHeading } from "@/components/ui";
export default function RegisterPage(){return <><PageHeading eyebrow="Join the lab" title="Create your account" description="Secure password authentication is available now; Google and Discord activate when their environment credentials are configured."/><AuthForm mode="register"/></>}
