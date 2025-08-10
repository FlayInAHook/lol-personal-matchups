"use client";

import { Box, Container, createListCollection, Heading, HStack, Icon, Image, Input, Portal, Select, Text, useSelectContext, VStack } from "@chakra-ui/react";
import { useAtom } from "jotai";
import { memo, useDeferredValue, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { LuSearch } from "react-icons/lu";
import {
  championsAtom,
  laneAtom,
  latestVersionAtom,
  myChampsAtom,
  opponentChampAtom,
} from "../state/league";
import TierSelect from "./TierSelect";

type ChampItem = { label: string; value: string; icon: string };

const ChampOption = memo(function ChampOption({ item }: { item: ChampItem }) {
  return (
    <Select.Item item={item} key={item.value}>
      <HStack gap={2}>
        <Image src={item.icon} alt={item.label} boxSize="5" rounded="sm" loading="lazy" decoding="async" />
        {item.label}
      </HStack>
      <Select.ItemIndicator />
    </Select.Item>
  );
});

// Idle render helpers (top-level to avoid re-creation)
const useIdleSlice = (len: number, initial = 48) => {
  const [count, setCount] = useState(Math.min(initial, len));
  useEffect(() => {
    // reset count when length changes
    setCount(Math.min(initial, len));
    const w = window as any;
    const schedule =
      (w.requestIdleCallback as any) ||
      ((cb: Function) => setTimeout(() => cb({ timeRemaining: () => 0 }), 1));
    const cancel =
      (w.cancelIdleCallback as any) ||
      ((id: any) => clearTimeout(id));
    const id = schedule(() => setCount(len));
    return () => cancel(id);
  }, [len, initial]);
  return count;
};

// Stable menu components: defined at module scope so they don't remount on parent re-render
function MyMenuList({ items, query, setQuery }: { items: ChampItem[]; query: string; setQuery: (v: string) => void }) {
  const count = useIdleSlice(items.length);
  const slice = items.slice(0, count);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // Ensure the search input retains focus even when the menu content re-renders
  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, [query, slice.length]);
  return (
    <>
      <HStack
        px="2"
        py="2"
        position="sticky"
        top="0"
        bg="bg"
        borderBottomWidth="1px"
        borderColor="border"
        zIndex={1}
        onPointerDown={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        onKeyDownCapture={(e) => {
          // prevent Select composite from hijacking keys
          e.stopPropagation();
          (e as any).nativeEvent?.stopImmediatePropagation?.();
        }}
      >
        <Icon as={LuSearch} color="fg.muted" />
        <Input
          ref={inputRef}
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search champions..."
          size="xs"
          onKeyDown={(e) => e.stopPropagation()}
          onKeyUp={(e) => e.stopPropagation()}
          onKeyPress={(e) => e.stopPropagation() as any}
          onKeyDownCapture={(e) => {
            e.stopPropagation();
            (e as any).nativeEvent?.stopImmediatePropagation?.();
          }}
        />
      </HStack>
      {items.length === 0 && (
        <Text px="3" py="2" color="fg.muted" fontSize="sm">No results</Text>
      )}
      {slice.map((item) => (
        <ChampOption key={item.value} item={item} />
      ))}
    </>
  );
}

function OppMenuList({ items, query, setQuery }: { items: ChampItem[]; query: string; setQuery: (v: string) => void }) {
  const count = useIdleSlice(items.length);
  const slice = items.slice(0, count);
  const inputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, [query, slice.length]);
  return (
    <>
      <HStack
        px="2"
        py="2"
        position="sticky"
        top="0"
        bg="bg"
        borderBottomWidth="1px"
        borderColor="border"
        zIndex={1}
        onPointerDown={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        onKeyDownCapture={(e) => {
          e.stopPropagation();
          (e as any).nativeEvent?.stopImmediatePropagation?.();
        }}
      >
        <Icon as={LuSearch} color="fg.muted" />
        <Input
          ref={inputRef}
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search champions..."
          size="xs"
          onKeyDown={(e) => e.stopPropagation()}
          onKeyUp={(e) => e.stopPropagation()}
          onKeyPress={(e) => e.stopPropagation() as any}
          onKeyDownCapture={(e) => {
            e.stopPropagation();
            (e as any).nativeEvent?.stopImmediatePropagation?.();
          }}
        />
      </HStack>
      {items.length === 0 && (
        <Text px="3" py="2" color="fg.muted" fontSize="sm">No results</Text>
      )}
      {slice.map((item) => (
        <ChampOption key={item.value} item={item} />
      ))}
    </>
  );
}

function MyValue() {
  const select = useSelectContext();
  const items = (select.selectedItems as ChampItem[]) ?? [];
  if (!items.length) {
    return <Select.ValueText placeholder="Pick your champ(s)" />;
  }
  const shown = items.slice(0, 3);
  const extra = items.length - shown.length;
  return (
    <HStack gap={2} wrap="nowrap">
      <HStack gap={1}>
        {shown.map((it) => (
          <Image key={it.value} src={it.icon} alt={it.label} boxSize="5" rounded="sm" />
        ))}
      </HStack>
      <Text fontSize="sm" css={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {shown.map((s) => s.label).join(", ")}
        {extra > 0 ? ` +${extra}` : ""}
      </Text>
    </HStack>
  );
}

function OpponentValue() {
  const select = useSelectContext();
  const items = (select.selectedItems as ChampItem[]) ?? [];
  if (!items.length) {
    return <Select.ValueText placeholder="Pick opponent" />;
  }
  const it = items[0];
  return (
    <HStack gap={2}>
      <Image src={it.icon} alt={it.label} boxSize="5" rounded="sm" />
      <Text>{it.label}</Text>
    </HStack>
  );
}

export default function MatchupSelect() {
  const [champs] = useAtom(championsAtom);
  const [myChamps, setMyChamps] = useAtom(myChampsAtom);
  const [opponent, setOpponent] = useAtom(opponentChampAtom);
  const [version] = useAtom(latestVersionAtom);
  const [lane, setLane] = useAtom(laneAtom);
  
  const [myQuery, setMyQuery] = useState("");
  const [oppQuery, setOppQuery] = useState("");
  const deferredMyQuery = useDeferredValue(myQuery);
  const deferredOppQuery = useDeferredValue(oppQuery);
  const [isPending, startTransition] = useTransition();
  

  const collection = useMemo(() => {
    const items: ChampItem[] = champs.map((c) => ({
      label: c.name,
      value: c.id,
      icon: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${c.image.full}`,
    }));
    return createListCollection({ items });
  }, [champs, version]);

  const myFilteredItems = useMemo(() => {
    const q = deferredMyQuery.trim().toLowerCase();
    if (!q) return collection.items;
    return collection.items.filter((i) => i.label.toLowerCase().includes(q));
  }, [collection.items, deferredMyQuery]);

  const oppFilteredItems = useMemo(() => {
    const q = deferredOppQuery.trim().toLowerCase();
    if (!q) return collection.items;
    return collection.items.filter((i) => i.label.toLowerCase().includes(q));
  }, [collection.items, deferredOppQuery]);

  const laneCollection = useMemo(() => {
    return createListCollection({
      items: [
        { label: "Top", value: "top" },
        { label: "Jungle", value: "jungle" },
        { label: "Middle", value: "middle" },
        { label: "Bottom", value: "bottom" },
        { label: "Support", value: "support" },
      ],
    });
  }, []);

  // selectors only

  return (
    <Container maxW="4xl" py={6}>
      <VStack align="stretch" gap={4}>
        <Heading size="md">Choose your matchup</Heading>
        <HStack gap={4} align="flex-start" wrap="wrap">
          {/* Your champions (multi-select) */}
          <Box minW={{ base: "full", md: "sm" }}>
            <Select.Root
              multiple
              collection={collection}
              value={myChamps}
              onValueChange={(e) => startTransition(() => setMyChamps(e.value))}
              size="sm"
              width="full"
              positioning={{ sameWidth: true }}
              lazyMount
              unmountOnExit
              skipAnimationOnMount
            >
              <Select.HiddenSelect name="my_champions" />
              <Select.Label>Your champion(s)</Select.Label>
              <Select.Control>
                <Select.Trigger>
                  <MyValue />
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Select.ClearTrigger />
                  <Select.Indicator />
                </Select.IndicatorGroup>
              </Select.Control>
              <Portal>
                <Select.Positioner>
                  <Select.Content>
                    <MyMenuList items={myFilteredItems} query={myQuery} setQuery={setMyQuery} />
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>
          </Box>

          {/* Opponent champion (single) */}
          <Box minW={{ base: "full", md: "sm" }}>
            <Select.Root
              collection={collection}
              value={opponent ? [opponent] : []}
              onValueChange={(e) => startTransition(() => setOpponent(e.value[0] ?? ""))}
              size="sm"
              width="full"
              positioning={{ sameWidth: true }}
              lazyMount
              unmountOnExit
              skipAnimationOnMount
            >
              <Select.HiddenSelect name="opponent_champion" />
              <Select.Label>Opponent champion</Select.Label>
              <Select.Control>
                <Select.Trigger>
                  <OpponentValue />
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Select.ClearTrigger />
                  <Select.Indicator />
                </Select.IndicatorGroup>
              </Select.Control>
              <Portal>
                <Select.Positioner>
                  <Select.Content>
                    <OppMenuList items={oppFilteredItems} query={oppQuery} setQuery={setOppQuery} />
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>
          </Box>

          {/* Lane selection */}
          <Box minW={{ base: "full", md: "xs" }}>
            <Select.Root
              collection={laneCollection}
              value={lane ? [lane] : []}
              onValueChange={(e) => startTransition(() => setLane((e.value[0] as any) ?? ""))}
              size="sm"
              width="full"
              positioning={{ sameWidth: true }}
              lazyMount
              unmountOnExit
              skipAnimationOnMount
            >
              <Select.HiddenSelect name="lane" />
              <Select.Label>Lane</Select.Label>
              <Select.Control>
                <Select.Trigger>
                  <Select.ValueText placeholder="Select lane" />
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Select.ClearTrigger />
                  <Select.Indicator />
                </Select.IndicatorGroup>
              </Select.Control>
              <Select.Positioner>
                <Select.Content>
                  {laneCollection.items.map((item) => (
                    <Select.Item item={item} key={item.value}>
                      {item.label}
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Select.Root>
          </Box>
          <TierSelect />
        </HStack>

      </VStack>
    </Container>
  );
}
