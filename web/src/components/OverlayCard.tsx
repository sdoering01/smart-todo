import "./OverlayCard.css";

type OverlayCardProps = React.PropsWithChildren;

function OverlayCard({ children }: OverlayCardProps) {
    return (
        <div className="overlay-card__wrapper">
            <div className="overlay-card">
                <h1 className="overlay-card__title">Smart Todo</h1>
                {children}
            </div>
        </div>
    );
}

export default OverlayCard;
