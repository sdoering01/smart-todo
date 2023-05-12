import "./GraphViewPage.css";
import PageCard from "../../components/PageCard";
import PageHeader from "../../components/PageHeader";

function GraphViewPage() {
    return (
        <PageCard header={<PageHeader startContent={<h1 className="graph-view-page__title">Graph</h1>} />}>
            <h2>Coming soon. Stay tuned!</h2>
        </PageCard>
    );
}

export default GraphViewPage;
