import { Container, Heading, Skeleton, VStack } from "@chakra-ui/react";
import { Suspense } from "react";
import LolalyticsSummary from "./components/LolalyticsSummary";
import MatchupSelect from "./components/MatchupSelect";
import { Provider } from "./components/ui/provider";
import "./index.css";


function App() {
  return (
    <Provider>
      <Suspense fallback={<Container maxW="4xl" py={8}><VStack gap={4}><Heading size="lg">Choose your matchup</Heading><Skeleton height="40px" /><Skeleton height="40px" /></VStack></Container>}>
      <MatchupSelect />

      <LolalyticsSummary />
      </Suspense>
    </Provider>
  )
}

export default App;
