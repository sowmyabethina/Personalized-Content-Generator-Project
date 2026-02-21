/**
 * Mind Map Service
 * 
 * This module generates a hierarchical mind map from document text
 * using local NLP (keyword extraction) without any external AI APIs.
 */

// Comprehensive list of stopwords
const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 
  'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 
  'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall',
  'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 
  'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'between', 'under', 'again',
  'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
  'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
  'very', 'just', 'also', 'now', 'about', 'up', 'down', 'out', 'off',
  'over', 'while', 'if', 'because', 'until', 'unless', 'although',
  'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them',
  'their', 'what', 'which', 'who', 'whom', 'we', 'you', 'he', 'she',
  'me', 'him', 'her', 'us', 'my', 'your', 'his', 'our', 'any', 'both',
  'every', 'either', 'neither', 'much', 'many', 'several', 'enough',
  'even', 'back', 'still', 'yet', 'already', 'always', 'never', 'ever',
  'however', 'therefore', 'otherwise', 'thus', 'hence', 'also', 'like',
  'get', 'got', 'make', 'made', 'take', 'took', 'see', 'saw', 'come', 'came',
  'go', 'went', 'say', 'said', 'know', 'knew', 'think', 'thought',
  'want', 'use', 'find', 'give', 'tell', 'try', 'call', 'keep', 'let',
  'put', 'seem', 'provide', 'provides', 'following', 'based', 'using',
  'done', 'given', 'shown', 'seen', 'called', 'included', 'containing',
  'consists', 'form', 'forms', 'written', 'called', 'known', 'considered',
  'able', 'certain', 'likely', 'unlikely', 'possible', 'impossible',
  'required', 'needed', 'wanted', 'helps', 'allows', 'enables', 'works'
]);

// Generic words to exclude (not useful for mind maps)
const GENERIC_WORDS = new Set([
  'data', 'system', 'method', 'process', 'information', 'example', 'use', 'type',
  'value', 'way', 'means', 'case', 'point', 'fact', 'thing', 'sort', 'kind',
  'part', 'side', 'area', 'field', 'level', 'result', 'effect', 'issue',
  'problem', 'question', 'reason', 'idea', 'term', 'word', 'name', 'number',
  'person', 'people', 'time', 'year', 'years', 'day', 'days', 'page', 'pages',
  'section', 'chapter', 'figure', 'table', 'note', 'notes', 'reference',
  'see', 'shown', 'based', 'following', 'including', 'however', 'therefore',
  'thus', 'also', 'well', 'new', 'first', 'last', 'next', 'previous',
  'different', 'same', 'certain', 'various', 'particular', 'specific',
  'general', 'common', 'main', 'important', 'possible', 'necessary',
  'different', 'similar', 'available', 'used', 'using', 'able', 'unable',
  'within', 'without', 'along', 'across', 'among', 'around', 'behind',
  'beside', 'besides', 'beyond', 'inside', 'outside', 'onto', 'upon'
]);

// Plural to singular mapping (common patterns)
const PLURAL_MAP = {
  'systems': 'system', 'databases': 'database', 'networks': 'network',
  'servers': 'server', 'clients': 'client', 'applications': 'application',
  'programs': 'program', 'functions': 'function', 'methods': 'method',
  'classes': 'class', 'objects': 'object', 'variables': 'variable',
  'constants': 'constant', 'parameters': 'parameter', 'arguments': 'argument',
  'returns': 'return', 'returns': 'return', 'algorithms': 'algorithm',
  'structures': 'structure', 'interfaces': 'interface', 'libraries': 'library',
  'frameworks': 'framework', 'components': 'component', 'modules': 'module',
  'packages': 'package', 'files': 'file', 'directories': 'directory',
  'users': 'user', 'developers': 'developer', 'devices': 'device',
  'computers': 'computer', 'documents': 'document', 'websites': 'website',
  'services': 'service', 'apis': 'api', 'endpoints': 'endpoint',
  'requests': 'request', 'responses': 'response', 'headers': 'header',
  'bodies': 'body', 'formats': 'format', 'schemas': 'schema',
  'models': 'model', 'controllers': 'controller', 'views': 'view',
  'routes': 'route', 'handlers': 'handler', 'events': 'event',
  'messages': 'message', 'commands': 'command', 'queries': 'query',
  'results': 'result', 'errors': 'error', 'warnings': 'warning',
  'logs': 'log', 'configs': 'config', 'settings': 'setting',
  'properties': 'property', 'attributes': 'attribute', 'methods': 'method',
  'operations': 'operation', 'processes': 'process', 'threads': 'thread',
  'sockets': 'socket', 'ports': 'port', 'hosts': 'host', 'domains': 'domain',
  'urls': 'url', 'paths': 'path', 'keys': 'key', 'tokens': 'token',
  'sessions': 'session', 'cookies': 'cookie', 'caches': 'cache',
  'queues': 'queue', 'stacks': 'stack', 'arrays': 'array', 'lists': 'list',
  'maps': 'map', 'sets': 'set', 'trees': 'tree', 'graphs': 'graph',
  'nodes': 'node', 'edges': 'edge', 'vertices': 'vertex', 'links': 'link'
};

// Semantic categories for grouping related concepts
const SEMANTIC_CATEGORIES = {
  'Programming': ['programming', 'coding', 'code', 'develop', 'development', 'implement', 'implementation', 'write', 'writing', 'script', 'scripting', 'compile', 'compiler', 'runtime', 'execute', 'execution', 'build', 'debug', 'debugging', 'test', 'testing', 'deploy', 'deployment', 'release'],
  'Data': ['database', 'db', 'sql', 'query', 'table', 'row', 'column', 'index', 'schema', 'record', 'store', 'storage', 'backup', 'restore', 'migrate', 'migration', 'replicate', 'replication', 'shard', 'partition', 'partitioning'],
  'Web': ['http', 'https', 'url', 'request', 'response', 'api', 'rest', 'graphql', 'websocket', 'html', 'css', 'javascript', 'browser', 'frontend', 'backend', 'fullstack', 'ajax', 'cors', 'cache', 'cdn'],
  'Security': ['security', 'auth', 'authentication', 'authorization', 'encrypt', 'encryption', 'decrypt', 'decryption', 'hash', 'hashing', 'password', 'token', 'jwt', 'oauth', 'ssl', 'tls', 'certificate', 'firewall', 'vpn', 'permission', 'access', 'role', 'privilege'],
  'Cloud': ['cloud', 'aws', 'azure', 'gcp', 'google', 'amazon', 'serverless', 'lambda', 'function', 'container', 'docker', 'kubernetes', 'k8s', 'pod', 'cluster', 'deployment', 'orchestration', 'microservice', 'microservices', 'saas', 'paas', 'iaas', 'virtual', 'vm'],
  'Network': ['network', 'tcp', 'udp', 'ip', 'dns', 'domain', 'host', 'port', 'socket', 'connection', 'protocol', 'router', 'switch', 'firewall', 'load', 'balancer', 'proxy', 'gateway', 'vpc', 'subnet', 'nat'],
  'Architecture': ['architecture', 'design', 'pattern', 'service', 'layer', 'tier', 'module', 'component', 'coupling', 'cohesion', 'abstraction', 'encapsulation', 'inheritance', 'polymorphism', 'interface', 'abstract', 'concrete', 'singleton', 'factory', 'builder', 'observer', 'strategy'],
  'Performance': ['performance', 'optimize', 'optimization', 'speed', 'latency', 'throughput', 'scalability', 'scale', 'load', 'stress', 'benchmark', 'profiling', 'profile', 'monitor', 'monitoring', 'cache', 'caching', 'memoization', 'lazy', 'eager', 'efficient', 'inefficient'],
  'Data Structures': ['array', 'list', 'linked', 'stack', 'queue', 'heap', 'tree', 'binary', 'bst', 'graph', 'hash', 'map', 'set', 'dictionary', 'tuple', 'collection', 'iterator', 'generator', 'sequence', '排序', 'sort'],
  'Algorithms': ['algorithm', 'sort', 'search', 'find', 'traverse', 'traversal', 'bfs', 'dfs', 'dynamic', 'recursion', 'iteration', 'loop', 'complexity', 'big-o', 'o(n)', 'o(log n)', 'o(n^2)', 'optimize', 'greedy', 'divide', 'conquer'],
  'Version Control': ['git', 'version', 'commit', 'push', 'pull', 'merge', 'branch', 'checkout', 'rebase', 'stash', 'conflict', 'repository', 'repo', 'clone', 'fork', 'pr', 'pull request', 'diff', 'patch'],
  'DevOps': ['devops', 'ci', 'cd', 'pipeline', 'jenkins', 'github', 'gitlab', 'circleci', 'travis', 'automation', 'automate', 'infrastructure', 'iac', 'terraform', 'ansible', 'chef', 'puppet', 'monitoring', 'logging', 'alerting'],
  'Languages': ['javascript', 'java', 'python', 'typescript', 'c++', 'csharp', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'html', 'css', 'sql', 'bash', 'shell', 'powershell'],
  'Testing': ['test', 'testing', 'unit', 'integration', 'e2e', 'end-to-end', 'mock', 'stub', 'spy', 'assertion', 'expect', 'jest', 'mocha', 'pytest', 'junit', 'selenium', 'cypress', 'coverage']
};

/**
 * Preprocess text: clean and normalize
 */
function preprocessText(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Convert to lowercase
  let cleaned = text.toLowerCase();
  
  // Remove URLs
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, ' ');
  
  // Remove email addresses
  cleaned = cleaned.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, ' ');
  
  // Remove code snippets (between backticks)
  cleaned = cleaned.replace(/`[^`]+`/g, ' ');
  
  // Remove numbers (standalone)
  cleaned = cleaned.replace(/\b\d+\b/g, ' ');
  
  // Remove punctuation except hyphens in compound words
  cleaned = cleaned.replace(/[^\w\s-]/g, ' ');
  
  // Remove extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

/**
 * Tokenize and filter words
 */
function tokenizeAndFilter(text) {
  const words = text.split(/\s+/);
  const filtered = [];
  
  for (let word of words) {
    // Trim and normalize
    word = word.trim().toLowerCase();
    
    // Remove trailing dots
    word = word.replace(/\.+$/, '');
    
    // Skip if too short or too long
    if (word.length < 3 || word.length > 25) continue;
    
    // Skip stopwords
    if (STOPWORDS.has(word)) continue;
    
    // Skip generic words
    if (GENERIC_WORDS.has(word)) continue;
    
    // Convert plural to singular
    word = PLURAL_MAP[word] || word;
    
    // Skip again after singularization
    if (STOPWORDS.has(word) || GENERIC_WORDS.has(word)) continue;
    
    filtered.push(word);
  }
  
  // Remove duplicates while preserving order
  const unique = [];
  const seen = new Set();
  for (const word of filtered) {
    if (!seen.has(word)) {
      seen.add(word);
      unique.push(word);
    }
  }
  
  return unique;
}

/**
 * Calculate word importance based on multiple factors
 */
function calculateImportance(word, allWords) {
  // Count frequency
  const frequency = allWords.filter(w => w === word).length;
  
  // Check if it's in a semantic category (bonus points)
  let categoryBonus = 0;
  for (const [category, keywords] of Object.entries(SEMANTIC_CATEGORIES)) {
    if (keywords.includes(word)) {
      categoryBonus = 3;
      break;
    }
  }
  
  // Longer words tend to be more specific
  const lengthBonus = Math.min(word.length / 10, 1);
  
  return frequency + categoryBonus + lengthBonus;
}

/**
 * Group related words into categories
 */
function groupIntoCategories(words) {
  const categories = {};
  
  // Initialize categories
  for (const category of Object.keys(SEMANTIC_CATEGORIES)) {
    categories[category] = [];
  }
  categories['Other'] = [];
  
  // Assign words to categories
  for (const word of words) {
    let assigned = false;
    
    for (const [category, keywords] of Object.entries(SEMANTIC_CATEGORIES)) {
      if (keywords.includes(word)) {
        categories[category].push(word);
        assigned = true;
        break;
      }
    }
    
    if (!assigned) {
      categories['Other'].push(word);
    }
  }
  
  // Filter out empty categories
  const result = {};
  for (const [category, wordsList] of Object.entries(categories)) {
    if (wordsList.length > 0) {
      result[category] = wordsList;
    }
  }
  
  return result;
}

/**
 * Detect main topic from the text
 */
function detectMainTopic(words, text) {
  // Find the most important technical term
  const wordImportance = {};
  
  for (const word of words) {
    wordImportance[word] = calculateImportance(word, words);
  }
  
  // Sort by importance
  const sorted = Object.entries(wordImportance)
    .sort((a, b) => b[1] - a[1]);
  
  // Get top important word as main topic
  if (sorted.length > 0) {
    const mainTopic = sorted[0][0];
    return mainTopic.charAt(0).toUpperCase() + mainTopic.slice(1);
  }
  
  return 'Document Overview';
}

/**
 * Build hierarchical mind map
 */
function buildMindMap(text) {
  // Step 1: Preprocess
  const cleaned = preprocessText(text);
  
  if (!cleaned) {
    return {
      title: 'No Content',
      children: []
    };
  }
  
  // Step 2: Tokenize and filter
  const words = tokenizeAndFilter(cleaned);
  
  if (words.length === 0) {
    return {
      title: 'No Keywords Found',
      children: []
    };
  }
  
  // Step 3: Detect main topic
  const mainTopic = detectMainTopic(words, cleaned);
  
  // Step 4: Group into categories
  const categories = groupIntoCategories(words);
  
  // Step 5: Calculate importance for each category
  const categoryImportance = {};
  for (const [category, categoryWords] of Object.entries(categories)) {
    const totalImportance = categoryWords.reduce((sum, word) => 
      sum + calculateImportance(word, words), 0);
    categoryImportance[category] = totalImportance;
  }
  
  // Step 6: Sort categories by importance
  const sortedCategories = Object.entries(categoryImportance)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5) // Max 5 main categories
    .map(([cat]) => cat);
  
  // Step 7: Build tree
  const mindMap = {
    title: mainTopic,
    children: []
  };
  
  for (const category of sortedCategories) {
    const categoryWords = categories[category];
    
    // Sort words in category by importance
    const sortedWords = categoryWords
      .map(word => ({ word, importance: calculateImportance(word, words) }))
      .sort((a, b) => b.importance - a.importance)
      .map(w => w.word);
    
    // Take top 3-5 words per category
    const topWords = sortedWords.slice(0, 4);
    
    if (topWords.length === 0) continue;
    
    // Create subtopics
    const subtopics = topWords.map(word => ({
      title: word.charAt(0).toUpperCase() + word.slice(1),
      children: []
    }));
    
    mindMap.children.push({
      title: category,
      children: subtopics
    });
  }
  
  // If no categories, create a flat structure with top words
  if (mindMap.children.length === 0) {
    const topWords = words
      .slice(0, 8)
      .map(word => ({ word, importance: calculateImportance(word, words) }))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 6)
      .map(w => w.word);
    
    // Group into pairs
    for (let i = 0; i < topWords.length; i += 2) {
      mindMap.children.push({
        title: topWords[i].charAt(0).toUpperCase() + topWords[i].slice(1),
        children: topWords[i + 1] ? [{
          title: topWords[i + 1].charAt(0).toUpperCase() + topWords[i + 1].slice(1),
          children: []
        }] : []
      });
    }
  }
  
  return mindMap;
}

/**
 * Generate mind map from text
 */
export function generateMindMap(text) {
  try {
    // Validate input
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid text input');
    }

    // Build the mind map
    const mindMap = buildMindMap(text);

    return mindMap;
  } catch (error) {
    console.error('Mind map generation error:', error);
    return {
      title: 'Error',
      children: [{
        title: 'Failed to generate mind map',
        children: []
      }]
    };
  }
}
