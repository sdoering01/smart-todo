import "./AuthLabel.css";

type AuthLabelProps = React.PropsWithChildren;

function AuthLabel({ children }: AuthLabelProps) {
    return <label className="auth-label">{children}</label>;
}

export default AuthLabel;
