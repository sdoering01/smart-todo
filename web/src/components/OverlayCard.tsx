import "./OverlayCard.css";

type OverlayCardProps = React.PropsWithChildren;

function OverlayCard({ children }: OverlayCardProps) {
    return (
        <div className="loading-overlay">
            <div className="loading-overlay__card">
                <h1 className="loading-overlay__title">Smart Todo</h1>
                {children}
            </div>
        </div>
    );
}

export default OverlayCard;
