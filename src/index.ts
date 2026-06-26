interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * OpenSanctions MCP — Global sanctions and PEP data (free, no auth required)
 *
 * Tools:
 * - search_entities: search sanctioned entities by name, schema, or country
 * - get_entity: get full details for a specific entity by ID
 */


const BASE = 'https://api.opensanctions.org';

// ── Types ─────────────────────────────────────────────────────────────

type OSEntity = {
  id?: string | null;
  caption?: string | null;
  schema?: string | null;
  properties?: Record<string, string[]> | null;
  datasets?: string[] | null;
  referents?: string[] | null;
  first_seen?: string | null;
  last_seen?: string | null;
  last_change?: string | null;
  target?: boolean | null;
  score?: number | null;
  features?: Record<string, number> | null;
};

type OSSearchResponse = {
  total?: { value?: number; relation?: string } | null;
  results: OSEntity[];
};

function formatEntity(e: OSEntity) {
  const props = e.properties ?? {};
  return {
    id: e.id ?? null,
    caption: e.caption ?? null,
    schema: e.schema ?? null,
    datasets: e.datasets ?? [],
    target: e.target ?? null,
    score: e.score ?? null,
    first_seen: e.first_seen ?? null,
    last_seen: e.last_seen ?? null,
    last_change: e.last_change ?? null,
    names: props.name ?? [],
    countries: props.country ?? [],
    birth_date: props.birthDate?.[0] ?? null,
    nationality: props.nationality ?? [],
    topics: props.topics ?? [],
    position: props.position?.[0] ?? null,
    notes: props.notes ?? [],
  };
}

// ── Tool definitions ──────────────────────────────────────────────────

const tools: McpToolExport['tools'] = [
  {
    name: 'search_entities',
    description:
      'Search global sanctions, watchlists, and PEP (politically exposed persons) databases. Returns matched entities with names, countries, datasets, and sanctions details. Example: search_entities("Vladimir Putin") or search_entities("Huawei", schema="Company")',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Name or keyword to search (e.g., "Gazprom", "Kim Jong")' },
        schema: { type: 'string', description: 'Entity type: "Person", "Company", "Organization", "Vessel", "Aircraft"' },
        countries: { type: 'string', description: 'Comma-separated country codes (e.g., "ru,cn,ir")' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_entity',
    description:
      'Get full details for a sanctioned entity by its OpenSanctions ID. Returns all properties including names, addresses, identifiers, sanctions programs, and related entities.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'OpenSanctions entity ID (e.g., "Q7747")' },
      },
      required: ['id'],
    },
  },
];

// ── callTool dispatcher ───────────────────────────────────────────────

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'search_entities':
      return searchEntities(
        args.query as string,
        args.schema as string | undefined,
        args.countries as string | undefined,
      );
    case 'get_entity':
      return getEntity(args.id as string);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ── Tool implementations ─────────────────────────────────────────────

async function searchEntities(query: string, schema?: string, countries?: string) {
  const params = new URLSearchParams({ q: query, limit: '20' });
  if (schema) params.set('schema', schema);
  if (countries) {
    for (const c of countries.split(',')) {
      params.append('countries', c.trim());
    }
  }

  const res = await fetch(`${BASE}/search/default?${params}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenSanctions API error (${res.status}): ${text}`);
  }

  const data = (await res.json()) as OSSearchResponse;

  return {
    query,
    total: data.total?.value ?? data.results.length,
    returned: data.results.length,
    entities: data.results.map(formatEntity),
  };
}

async function getEntity(id: string) {
  const res = await fetch(`${BASE}/entities/${id}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`OpenSanctions API error (${res.status}): entity ${id} not found`);

  const data = (await res.json()) as OSEntity;
  return formatEntity(data);
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
