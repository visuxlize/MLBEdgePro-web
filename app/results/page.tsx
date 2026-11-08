import { Header } from "@/components/landing/header";
import { LandingFooter } from "@/components/landing/footer";
import { ResultsView } from "@/components/landing/results-view";
import { allScorecards } from "@/lib/results/backtest";

export const revalidate = 21600;

export const metadata = {
  title: "Results — Edge Pro",
  description: "Out-of-sample model scorecards for the NBA, NFL and soccer: every game predicted before it was played.",
};

export default async function ResultsPage() {
  const cards = await allScorecards();
  return (
    <>
      <Header />
      <ResultsView cards={cards} />
      <LandingFooter />
    </>
  );
}
