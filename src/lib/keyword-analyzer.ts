import { TailoredResume, KeywordAnalysis } from "./types";

// Multi-word technical phrases to detect as a single unit
const TECH_PHRASES = [
  "machine learning", "deep learning", "natural language processing",
  "computer vision", "data science", "data engineering", "data pipeline",
  "ci/cd", "ci cd", "continuous integration", "continuous deployment",
  "unit testing", "integration testing", "end to end", "e2e",
  "version control", "source control", "pull request",
  "rest api", "restful api", "graphql api",
  "object oriented", "design patterns", "system design",
  "cloud computing", "distributed systems", "microservices",
  "agile", "scrum", "kanban", "sprint",
  "full stack", "front end", "back end", "frontend", "backend",
  "mobile development", "ios development", "android development",
  "test driven", "behavior driven",
  "project management", "product management",
  "supply chain", "customer facing",
  "large language models", "large language model", "llm",
  "retrieval augmented generation", "retrieval-augmented generation",
  "convolutional neural network", "recurrent neural network",
  "generative ai", "reinforcement learning",
  "data structures", "algorithms",
  "event driven", "message queue",
  "serverless", "infrastructure as code",
  "real time", "real-time",
];

// Whitelist of known technical single-word keywords
const TECH_KEYWORDS = new Set([
  // Programming languages
  "python", "javascript", "typescript", "java", "golang", "go", "rust",
  "ruby", "php", "swift", "kotlin", "scala", "r", "matlab", "perl",
  "bash", "shell", "powershell", "groovy", "elixir", "haskell", "lua",
  "dart", "c", "c++", "c#", "f#", "cobol", "fortran", "zig", "nim",
  "ocaml", "clojure", "erlang", "julia",

  // Web frameworks & libraries
  "react", "angular", "vue", "svelte", "nextjs", "next.js", "nuxt",
  "gatsby", "remix", "astro", "solid", "qwik",
  "django", "flask", "fastapi", "express", "nestjs", "koa", "hapi",
  "rails", "sinatra", "laravel", "symfony", "codeigniter", "yii",
  "spring", "hibernate", "struts", "quarkus", "micronaut",
  "asp.net", "blazor", "xamarin", "maui",
  "gin", "echo", "fiber", "chi",
  "actix", "axum", "rocket", "warp",

  // Frontend / UI
  "html", "css", "sass", "scss", "less", "tailwind", "bootstrap",
  "material-ui", "mui", "chakra", "shadcn", "antd", "styled-components",
  "webpack", "vite", "rollup", "parcel", "esbuild", "babel",
  "redux", "zustand", "jotai", "recoil", "mobx", "xstate", "pinia",
  "graphql", "apollo", "relay", "urql", "trpc",
  "websocket", "webrtc", "pwa", "wasm", "webassembly",

  // Databases
  "sql", "mysql", "postgresql", "postgres", "sqlite", "mariadb", "oracle",
  "mongodb", "mongoose", "redis", "memcached", "elasticsearch", "opensearch",
  "cassandra", "dynamodb", "firestore", "firebase", "supabase", "planetscale",
  "neo4j", "arangodb", "couchdb", "rethinkdb", "cockroachdb", "tidb",
  "snowflake", "bigquery", "redshift", "databricks", "clickhouse", "druid",

  // Cloud & DevOps
  "aws", "azure", "gcp", "cloudflare", "vercel", "netlify", "heroku",
  "docker", "kubernetes", "k8s", "helm", "istio", "envoy", "consul",
  "terraform", "pulumi", "ansible", "puppet", "chef", "vagrant",
  "jenkins", "circleci", "travis", "github", "gitlab", "bitbucket",
  "argocd", "flux", "spinnaker", "tekton",
  "nginx", "apache", "caddy", "traefik",
  "linux", "unix", "ubuntu", "debian", "centos", "rhel", "alpine",
  "lambda", "ec2", "s3", "ecs", "eks", "rds", "sqs", "sns", "kinesis",
  "cloudwatch", "datadog", "prometheus", "grafana", "sentry", "newrelic",
  "splunk", "pagerduty", "opsgenie",

  // ML / AI / Data
  "tensorflow", "pytorch", "keras", "jax", "mxnet",
  "scikit-learn", "sklearn", "xgboost", "lightgbm", "catboost",
  "pandas", "numpy", "scipy", "matplotlib", "seaborn", "plotly",
  "spark", "hadoop", "kafka", "flink", "airflow", "prefect", "dagster",
  "mlflow", "kubeflow", "sagemaker", "vertex", "huggingface",
  "langchain", "llamaindex", "openai", "anthropic", "llama",
  "nltk", "spacy", "gensim", "transformers",
  "opencv", "pillow", "albumentations",
  "jupyter", "notebook", "colab",

  // Mobile
  "ios", "android", "react-native", "flutter", "ionic", "cordova",
  "swiftui", "uikit", "jetpack", "compose",

  // Testing
  "jest", "mocha", "jasmine", "vitest", "cypress", "playwright",
  "selenium", "puppeteer", "testing-library", "pytest", "unittest",
  "rspec", "junit", "testng", "mockito", "cucumber", "storybook",

  // APIs & Protocols
  "rest", "api", "grpc", "soap", "http", "https", "tcp", "udp",
  "oauth", "jwt", "saml", "openid", "ldap", "ssh", "tls", "ssl",
  "json", "xml", "yaml", "toml", "protobuf", "avro", "parquet",

  // Architecture & Patterns
  "microservices", "monolith", "serverless", "event-driven",
  "mvc", "mvvm", "mvp", "ddd", "tdd", "bdd", "solid", "dry",
  "cqrs", "saga", "hexagonal", "clean",

  // Tools & Collaboration
  "git", "jira", "confluence", "figma", "postman", "insomnia",
  "swagger", "openapi", "datadog", "kibana", "grafana",
  "slack", "notion", "linear", "trello", "asana",

  // Security
  "oauth2", "sso", "rbac", "abac", "encryption", "hashing",
  "penetration", "vulnerability", "soc2", "gdpr", "hipaa",
  "firewall", "vpn", "zero-trust",

  // Concepts (technical)
  "algorithms", "concurrency", "parallelism", "multithreading",
  "caching", "indexing", "sharding", "replication", "partitioning",
  "orm", "sdk", "cli", "ide", "compiler", "interpreter",
  "virtualization", "containerization", "orchestration",
  "observability", "monitoring", "logging", "tracing",
  "devops", "devsecops", "sre", "mlops", "dataops", "gitops",
  "automation", "scripting",
]);

/**
 * Extract meaningful technical keywords and phrases from a job description.
 * Only returns recognized programming languages, frameworks, tools, and skills —
 * not every word from the job description.
 */
export function extractKeywords(jobDescription: string): string[] {
  const jdLower = jobDescription.toLowerCase();
  const found = new Set<string>();

  // First pass: detect multi-word technical phrases
  for (const phrase of TECH_PHRASES) {
    if (jdLower.includes(phrase)) {
      found.add(phrase);
    }
  }

  // Second pass: match individual words against the technical keyword whitelist
  // Split on whitespace and punctuation (keeping +, #, . for C++, C#, .NET etc.)
  const words = jdLower.match(/[a-z0-9#.+/-]+/g) || [];

  for (const word of words) {
    if (TECH_KEYWORDS.has(word)) {
      found.add(word);
    }
  }

  return Array.from(found);
}

/**
 * Build a single string of all resume text content for keyword matching.
 */
function getResumeText(resume: TailoredResume): string {
  const parts: string[] = [];

  // Skills
  parts.push(resume.technicalSkills.programmingLanguages);
  parts.push(resume.technicalSkills.frameworks);
  parts.push(resume.technicalSkills.developerTools);
  parts.push(resume.technicalSkills.libraries);

  // Work bullets
  for (const entry of resume.workExperience) {
    parts.push(...entry.bullets);
  }

  // Project bullets
  for (const entry of resume.projects) {
    parts.push(entry.name);
    parts.push(...entry.bullets);
  }

  // Leadership bullets
  for (const entry of resume.leadership) {
    parts.push(entry.organization);
    parts.push(entry.role);
    parts.push(...entry.bullets);
  }

  // Certification skills
  for (const entry of resume.certifications) {
    parts.push(entry.skills);
  }

  return parts.join(" ").toLowerCase();
}

/**
 * Analyze how well a tailored resume matches keywords from the job description.
 */
export function analyzeKeywordMatch(
  jobDescription: string,
  resume: TailoredResume
): KeywordAnalysis {
  const keywords = extractKeywords(jobDescription);
  const resumeText = getResumeText(resume);

  const matched: string[] = [];
  const missed: string[] = [];

  for (const keyword of keywords) {
    if (resumeText.includes(keyword)) {
      matched.push(keyword);
    } else {
      missed.push(keyword);
    }
  }

  const score = keywords.length > 0
    ? Math.round((matched.length / keywords.length) * 100)
    : 0;

  return {
    score,
    matched,
    missed,
    total: keywords.length,
  };
}
