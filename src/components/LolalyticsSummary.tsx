import { Box, Button, Container, Heading, HStack, Image, Text, VStack } from "@chakra-ui/react";
import { useAtom } from "jotai";
import { useMemo, useState } from "react";
import {
  championsAtom,
  laneAtom,
  latestVersionAtom,
  LolalyticsMatchup,
  lolalyticsResultsAtom,
  myChampsAtom,
  opponentChampAtom,
  tierAtom,
} from "../state/league";

// Parse a Lolalytics summary string into metrics
function parseSummary(s: string | undefined | null) {
  if (!s) return { wr: undefined as number | undefined, diffAvg: undefined as number | undefined, normalized: undefined as number | undefined };
  const text = s.replace(/\s+/g, " ").trim();
  const re = /(\-?\d+(?:\.\d+)?)% of the time which is (\-?\d+(?:\.\d+)?)% different.*?After normalising.*?(\-?\d+(?:\.\d+)?)% different/i;
  const m = text.match(re);
  if (!m) return { wr: undefined, diffAvg: undefined, normalized: undefined };
  const wr = parseFloat(m[1]);
  const diffAvg = parseFloat(m[2]);
  const normalized = parseFloat(m[3]);
  return { wr, diffAvg, normalized };
}

export default function LolalyticsSummary() {
  const [champs] = useAtom(championsAtom);
  const [version] = useAtom(latestVersionAtom);
  const [myChamps] = useAtom(myChampsAtom);
  const [opponent] = useAtom(opponentChampAtom);
  const [lane] = useAtom(laneAtom);
  const [results, setResults] = useAtom(lolalyticsResultsAtom);
  const [loading, setLoading] = useState(false);
  const [tier, setTier] = useAtom(tierAtom);

  const champById = useMemo(() => {
    const map = new Map<string, { id: string; name: string; icon: string }>();
    for (const c of champs) {
      map.set(c.id.toLowerCase(), {
        id: c.id,
        name: c.name,
        icon: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${c.image.full}`,
      });
    }
    return map;
  }, [champs, version]);

  // Determine which datapoints are required and whether all are fetched
  const laneValReq = (lane || "").toLowerCase();
  const oppIdReq = (opponent || "").toLowerCase();
  const oppSlugReq = oppIdReq === "monkeyking" ? "wukong" : oppIdReq;
  const requiredOwns = useMemo(
    () => myChamps
      .filter((id) => (id || "").toLowerCase() !== oppIdReq)
      .map((id) => {
        const low = (id || "").toLowerCase();
        return low === "monkeyking" ? "wukong" : low;
      }),
    [myChamps, oppIdReq]
  );
  const requiredKeys = useMemo(
    () => (laneValReq && oppSlugReq ? requiredOwns.map((own) => `${own}|${oppSlugReq}|${laneValReq}|${tier}`) : []),
    [requiredOwns, oppSlugReq, laneValReq, tier]
  );
  const fetchedCount = useMemo(
    () => requiredKeys.filter((k) => !!results[k]?.summary).length,
    [requiredKeys, results]
  );
  const allFetched = Boolean(lane && opponent && requiredKeys.length > 0 && fetchedCount === requiredKeys.length);


  const fetchLolalytics = async () => {
    const laneVal = (lane || "").toLowerCase();
    const oppId = (opponent || "").toLowerCase();
    if (!laneVal || !oppId || myChamps.length === 0) return;
    const mapSlug = (id: string) => (id.toLowerCase() === "monkeyking" ? "wukong" : id.toLowerCase());
    setLoading(true);
    try {
      const tasks = myChamps.map(async (id) => {
        const own = mapSlug(id);
        const opp = mapSlug(oppId);
        if (own === opp) return; // skip mirror matchup
        const key = `${own}|${opp}|${laneVal}|${tier}`;
        if (results[key]) return; // skip cached
        const target = `https://lolalytics.com/lol/${own}/vs/${opp}/build/?lane=${laneVal}&tier=${tier}&vslane=${laneVal}&patch=30`;
        const proxy = `https://corsmirror.com/v1?url=${encodeURIComponent(target)}`;
        const res = await fetch(proxy);
        if (!res.ok) throw new Error(String(res.status));
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        const node = doc.querySelector('.lolx-links > span:nth-child(1)');
        const text = (node?.textContent || "").trim();
        const gamesSel = doc.querySelector('.w-44 > div:nth-child(1) > div:nth-child(2) > div:nth-child(1)');
        const gamesText = (gamesSel?.textContent || '').trim().replace(/[,\s]/g, "");
        const games = Number.isFinite(Number(gamesText)) ? Number(gamesText) : undefined;
        const payload: LolalyticsMatchup = { summary: text, games };
        setResults((prev) => ({ ...prev, [key]: payload }));
      });
      await Promise.allSettled(tasks);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="7xl" py={4}>
      <VStack align="stretch" gap={3}>
        <HStack justifyContent={"center"}>
          <Button
            size="sm"
            onClick={fetchLolalytics}
            disabled={!lane || !opponent || myChamps.length === 0}
            loading={loading}
          >
            Fetch Lolalytics
          </Button>
          {!lane || !opponent || myChamps.length === 0 ? (
            <Text color="fg.muted" fontSize="xs">Select your champs, opponent, and lane to fetch.</Text>
          ) : requiredKeys.length > 0 ? (
            <Text color="fg.muted" fontSize="xs">{fetchedCount}/{requiredKeys.length} fetched{loading ? "…" : ""}</Text>
          ) : null}
        </HStack>

        {allFetched && (
          <Box borderWidth="1px" rounded="md" p={3} bg="bg">
            <Heading size="sm" mb={2}>Lolalytics snapshot</Heading>
            {(() => {
              const laneVal = (lane || "").toLowerCase();
              const opp = (opponent || "").toLowerCase();
              const entries = myChamps
                .filter((id) => (id || "").toLowerCase() !== opp)
                .map((id) => {
                  const own = (id || "").toLowerCase();
                  const key = `${own === "monkeyking" ? "wukong" : own}|${opp === "monkeyking" ? "wukong" : opp}|${laneVal}|${tier}`;
                  const rec = results[key];
                  const metrics = parseSummary(rec?.summary);
                  const games = rec?.games;
                  return { id, own, key, games, ...metrics };
                });
              const valid = entries.filter((s) => Number.isFinite(s.normalized as number) || Number.isFinite(s.diffAvg as number) || Number.isFinite(s.wr as number));
              if (valid.length === 0) return null;
              const byNorm = [...valid].sort((a, b) => {
                const aNorm = (a.normalized ?? Number.NEGATIVE_INFINITY);
                const bNorm = (b.normalized ?? Number.NEGATIVE_INFINITY);
                if (bNorm !== aNorm) return (bNorm as number) - (aNorm as number);
                const aAvg = (a.diffAvg ?? Number.NEGATIVE_INFINITY);
                const bAvg = (b.diffAvg ?? Number.NEGATIVE_INFINITY);
                if (bAvg !== aAvg) return (bAvg as number) - (aAvg as number);
                const aWr = (a.wr ?? 0) - 50;
                const bWr = (b.wr ?? 0) - 50;
                return bWr - aWr;
              });
              const byWr = [...valid].sort((a, b) => {
                const aWr = (a.wr ?? Number.NEGATIVE_INFINITY);
                const bWr = (b.wr ?? Number.NEGATIVE_INFINITY);
                if (bWr !== aWr) return (bWr as number) - (aWr as number);
                const aNorm = (a.normalized ?? Number.NEGATIVE_INFINITY);
                const bNorm = (b.normalized ?? Number.NEGATIVE_INFINITY);
                if (bNorm !== aNorm) return (bNorm as number) - (aNorm as number);
                const aAvg = (a.diffAvg ?? Number.NEGATIVE_INFINITY);
                const bAvg = (b.diffAvg ?? Number.NEGATIVE_INFINITY);
                return (bAvg as number) - (aAvg as number);
              });
              const Row = ({ data, label }: { data: typeof valid; label: string }) => (
                <VStack align="stretch" gap={2} mb={3}>
                  <Text fontSize="sm" color="fg.muted">{label}</Text>
                  <Box pb={1}>
                    <HStack gap={4} align="stretch" minH="20" overflowX="auto" >
                      {data.map((p) => {
                        const info = champById.get(p.id.toLowerCase());
                        // Build the Lolalytics URL for this matchup
                        const oppSlug = (opponent || "").toLowerCase() === "monkeyking" ? "wukong" : (opponent || "").toLowerCase();
                        const ownSlug = p.own === "monkeyking" ? "wukong" : p.own;
                        const laneVal = (lane || "").toLowerCase();
                        const url = `https://lolalytics.com/lol/${ownSlug}/vs/${oppSlug}/build/?lane=${laneVal}&tier=${tier}&vslane=${laneVal}&patch=30`;
                        return (
                          <div
                            key={p.key}
                            onClick={() => window.open(url, "_blank")}
                            style={{ textDecoration: "none", cursor: "pointer" }}
                          >
                            <VStack minW="160px" maxW="36" align="center" gap={1} _hover={{ bg: "gray.50/10" }}>
                              {info && <Image src={info.icon} alt={info.name} boxSize={10} rounded="md" />}
                              <Text fontWeight="medium" css={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 128 }}>{info?.name ?? p.id}</Text>
                              <Text fontSize="xs" color="fg.muted">
                                {(() => {
                                  if (label.includes("Normalized")) {
                                    if (Number.isFinite(p.normalized as number)) {
                                      return `Norm ${p.normalized!.toFixed(2)}%`;
                                    } else if (Number.isFinite(p.diffAvg as number)) {
                                      return `Vs-avg ${p.diffAvg!.toFixed(2)}%`;
                                    } else {
                                      return "";
                                    }
                                  } else {
                                    return Number.isFinite(p.wr as number) ? `WR ${p.wr!.toFixed(2)}%` : "";
                                  }
                                })()}
                                {Number.isFinite(p.games as number) ? ` · ${p.games} games` : ""}
                              </Text>
                            </VStack>
                          </div>
                        );
                      })}
                    </HStack>
                  </Box>
                </VStack>
              );

              return (
                <>
                  <Row data={byNorm} label="All picks · Normalized advantage" />
                  <Row data={byWr} label="All picks · Win rate" />
                </>
              );
            })()}
          </Box>
        )}
      </VStack>
    </Container>
  );
}
