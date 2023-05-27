import "./PageCard.css";

type PageCardProps = {
    header?: JSX.Element;
    children?: JSX.Element;
};

function PageCard({header, children}: PageCardProps) {
    return (
        <div className="page-card-wrapper">
            <div className="page-card">
                {header}
                <div className="page-card__body">
                    {children}
                </div>
            </div>
        </div>
    )
}

export default PageCard;
