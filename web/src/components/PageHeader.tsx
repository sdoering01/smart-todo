import { HiChevronLeft } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";

import "./PageHeader.css";

type PageHeaderProps = {
    withBackButton?: boolean;
    startContent?: JSX.Element;
    endContent?: JSX.Element;
};

function PageHeader({ withBackButton, startContent, endContent }: PageHeaderProps) {
    const navigate = useNavigate();

    return (
        <header className="page-header">
            <div className="page-header__start-group">
                {withBackButton && (
                    <button className="page-header__back-button" onClick={() => navigate(-1)}>
                        <HiChevronLeft className="page-header__back-icon" />
                    </button>
                )}
                {startContent}
            </div>
            <div className="page-header__end-group">{endContent}</div>
        </header>
    );
}

export default PageHeader;
