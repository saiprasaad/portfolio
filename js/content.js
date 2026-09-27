// Everything the site says about Sai lives in this file.
// The desktop, the phone layout, Spotlight, the terminal, Folio, the simple page and the
// prerendered HTML all read from here, so editing a fact once updates it everywhere.
// Keep this module free of DOM access: scripts/prerender.mjs imports it in Node.

export const site = {
  url: 'https://www.saiprasaad.com/',
  osName: 'SaiOS',
  osVersion: '2.0',
  // The Folio backend expects { message, context } and answers { reply } or { error }.
  folioEndpoint: 'https://folio-backend-two.vercel.app/api/chat',
  logRocketId: 'lgchpu/portfolio-hqfup',
  productionHosts: ['saiprasaad.com', 'www.saiprasaad.com'],
};

export const profile = {
  name: 'Saiprasaad Kalyanaraman',
  firstName: 'Saiprasaad',
  nickname: 'Sai',
  initials: 'SK',
  role: 'Full-Stack Software Engineer',
  headline: 'I build web, mobile and AI-powered products end to end, from React and Flutter front ends to Flask and Spring Boot services.',
  company: 'Afficiency',
  companyBlurb: 'an insurtech startup',
  location: 'New York, USA',
  city: 'New York',
  timeZone: 'America/New_York',
  email: 'saiprasaad1999@gmail.com',
  photo: {
    src: 'images/sai-320.webp',
    srcset: 'images/sai-160.webp 160w, images/sai-320.webp 320w, images/sai-640.webp 640w',
    fallback: 'images/sai-320.jpg',
    alt: 'Portrait of Saiprasaad Kalyanaraman',
  },
  links: [
    { id: 'github', label: 'GitHub', handle: 'github.com/saiprasaad', url: 'https://github.com/saiprasaad' },
    { id: 'linkedin', label: 'LinkedIn', handle: 'linkedin.com/in/saiprasaad', url: 'https://www.linkedin.com/in/saiprasaad/' },
    { id: 'hackerrank', label: 'HackerRank', handle: 'hackerrank.com/saiprasaad1999', url: 'https://www.hackerrank.com/profile/saiprasaad1999' },
  ],
  resume: {
    fileName: 'Saiprasaad_Kalyanaraman_Resume.pdf',
    view: 'https://drive.google.com/file/d/1m_iyqNUXY4m9T7eEBnZUM8GZTGVFlV5R/view?usp=sharing',
    download: 'https://drive.google.com/uc?export=download&id=1m_iyqNUXY4m9T7eEBnZUM8GZTGVFlV5R',
  },
  // {experience} is replaced with a phrase computed from the roles below, so it never goes stale.
  about: [
    "I'm a full-stack software engineer with a Master's in Computer Science and {experience} of experience building scalable web and mobile applications.",
    "At Afficiency, an insurtech startup, I build with React, Angular, Flask, Spring Boot, MySQL and Redis, and I'm exploring AI-powered tools and microservices that make systems faster and workflows simpler.",
    "I've won a hackathon, judged another, and I keep learning. I like blending technology and creativity to solve real problems and build experiences people enjoy using.",
  ],
};

// Skill ids are shared by the Skills view, project and role stacks, Spotlight and the Fit Check.
// `listed` skills are the ones Sai lists under Skills; the rest are evidenced by projects and roles.
// `match` holds regular-expression sources used to spot the skill in a job description.
export const skills = {
  c: { label: 'C', logo: 'c', match: ['\\bC\\s*/\\s*C\\+\\+', '\\bC programming', '\\bC language'] },
  java: { label: 'Java', logo: 'java', match: ['\\bjava\\b(?!\\s*script)'] },
  python: { label: 'Python', logo: 'python', match: ['\\bpython\\b'] },
  dart: { label: 'Dart', logo: 'dart', match: ['\\bdart\\b'] },
  swift: { label: 'Swift', logo: 'swift', match: ['CS:\\bSwift\\b(?!\\s*UI)'] },
  html: { label: 'HTML', logo: 'html', match: ['\\bhtml5?\\b'] },
  css: { label: 'CSS', logo: 'css', match: ['\\bcss3?\\b'] },
  bootstrap: { label: 'Bootstrap', logo: 'bootstrap', match: ['\\bbootstrap\\b'] },
  react: { label: 'React', logo: 'react', match: ['\\breact(?:\\.js|js)?\\b(?!\\s*native)'] },
  angular: { label: 'Angular', logo: 'angular', match: ['\\bangular(?:js)?\\b'] },
  javascript: { label: 'JavaScript', logo: 'javascript', match: ['\\bjavascript\\b', '\\bjs\\b', '\\bes6\\b', '\\becmascript\\b'] },
  typescript: { label: 'TypeScript', logo: 'typescript', match: ['\\btypescript\\b'] },
  springboot: { label: 'Spring Boot', logo: 'springboot', match: ['\\bspring(?:\\s*boot|\\s*framework|\\s*mvc)?\\b'] },
  nodejs: { label: 'Node.js', logo: 'nodejs', match: ['\\bnode(?:\\.js|js)?\\b'] },
  flask: { label: 'Flask', logo: 'flask', match: ['\\bflask\\b'] },
  php: { label: 'PHP', logo: 'php', match: ['\\bphp\\b'] },
  flutter: { label: 'Flutter', logo: 'flutter', match: ['\\bflutter\\b'] },
  android: { label: 'Android Studio', logo: 'androidstudio', match: ['\\bandroid\\b'] },
  mysql: { label: 'MySQL', logo: 'mysql', match: ['\\bmysql\\b'] },
  postgresql: { label: 'PostgreSQL', logo: 'postgresql', match: ['\\bpostgre(?:s|sql)\\b'] },
  sqlite: { label: 'SQLite', logo: 'sqlite', match: ['\\bsqlite\\b'] },
  mongodb: { label: 'MongoDB', logo: 'mongodb', match: ['\\bmongo(?:db)?\\b'] },
  firebase: { label: 'Firebase', logo: 'firebase', match: ['\\bfirebase\\b', '\\bfirestore\\b'] },
  redis: { label: 'Redis', mono: 'Rd', match: ['\\bredis\\b'] },
  genai: { label: 'Generative AI', mono: 'AI', match: ['\\bgenerative ai\\b', '\\bgen\\s?ai\\b'] },
  llms: { label: 'LLMs', mono: 'LM', match: ['\\bllms?\\b', '\\blarge language models?\\b'] },
  rag: { label: 'RAG', mono: 'RG', match: ['\\brag\\b', '\\bretrieval[- ]augmented'] },
  nlp: { label: 'NLP', mono: 'NL', match: ['\\bnlp\\b', '\\bnatural language processing\\b'] },
  ollama: { label: 'Ollama', mono: 'Ol', match: ['\\bollama\\b'] },
  openai: { label: 'OpenAI APIs', mono: 'OA', match: ['\\bopenai\\b', '\\bgpt(?:-?[34](?:\\.5)?|-?4o)?\\b', '\\bchatgpt\\b'] },
  huggingface: { label: 'Hugging Face', mono: 'HF', match: ['\\bhugging\\s?face\\b'] },
  git: { label: 'Git', logo: 'git', match: ['\\bgit\\b'] },
  docker: { label: 'Docker', logo: 'docker', match: ['\\bdocker\\b', '\\bcontaineri[sz]ation\\b'] },
  aws: { label: 'AWS', logo: 'aws', match: ['\\baws\\b', '\\bamazon web services\\b'] },
  figma: { label: 'Figma', logo: 'figma', match: ['\\bfigma\\b'] },
  streamlit: { label: 'Streamlit', logo: 'streamlit', match: ['\\bstreamlit\\b'] },

  // Evidenced by roles and projects rather than listed under Skills.
  gitlab: { label: 'GitLab', mono: 'GL', match: ['\\bgitlab\\b'] },
  cicd: { label: 'CI/CD', mono: 'CI', match: ['\\bci\\s*/\\s*cd\\b', '\\bcontinuous (?:integration|delivery|deployment)\\b'] },
  rest: { label: 'REST APIs', mono: 'API', match: ['CS:\\bREST(?:ful)?\\b', '\\brestful\\b', '\\brest\\s*apis?\\b'] },
  microservices: { label: 'Microservices', mono: 'MS', match: ['\\bmicro-?services?\\b'] },
  hibernate: { label: 'Hibernate', mono: 'Hb', match: ['\\bhibernate\\b'] },
  sql: { label: 'SQL', mono: 'SQL', match: ['\\bsql\\b'] },
  gcp: { label: 'Google Cloud', mono: 'GC', match: ['\\bgoogle cloud\\b', '\\bgcp\\b', '\\bcloud run\\b'] },
  elasticsearch: { label: 'Elasticsearch', logo: 'elasticsearch', match: ['\\belastic\\s?search\\b'] },
  tensorflow: { label: 'TensorFlow', mono: 'TF', match: ['\\btensorflow\\b', '\\bkeras\\b'] },
  ml: { label: 'Machine learning', mono: 'ML', match: ['\\bmachine learning\\b', '\\bml\\b', '\\bdeep learning\\b'] },
  forecasting: { label: 'Time-series forecasting', mono: 'TS', match: ['\\bforecast(?:ing)?\\b', '\\btime[- ]series\\b'] },
  pandas: { label: 'pandas', mono: 'pd', match: ['\\bpandas\\b'] },
  whisper: { label: 'Whisper', mono: 'Wh', match: ['\\bwhisper\\b', '\\bspeech[- ]to[- ]text\\b'] },
  highcharts: { label: 'Highcharts', mono: 'Hc', match: ['\\bhighcharts\\b'] },
  mui: { label: 'Material UI', mono: 'MUI', match: ['\\bmaterial[- ]ui\\b', '\\bmui\\b'] },
  reactflow: { label: 'React Flow', mono: 'RF', match: ['\\breact flow\\b'] },
  netlify: { label: 'Netlify', mono: 'Nf', match: ['\\bnetlify\\b'] },
  teams: { label: 'Teams API', mono: 'Tm', match: ['\\bmicrosoft teams\\b', '\\bteams api\\b'] },
  asana: { label: 'Asana API', mono: 'As', match: ['\\basana\\b'] },
  hubspot: { label: 'HubSpot', mono: 'HS', match: ['\\bhubspot\\b'] },
  aes: { label: 'AES-CBC encryption', mono: 'AES', match: ['\\baes\\b', '\\bencryption\\b', '\\bcryptograph'] },
  geolocation: { label: 'Geolocation', mono: 'Geo', match: ['\\bgeo-?location\\b', '\\bgps\\b', '\\bgeospatial\\b'] },
  logmeal: { label: 'LogMeal API', mono: 'LM', match: ['\\blogmeal\\b'] },
  gtts: { label: 'gTTS', mono: 'TTS', match: ['\\btext[- ]to[- ]speech\\b', '\\btts\\b'] },
  moviepy: { label: 'MoviePy', mono: 'MP', match: ['\\bmoviepy\\b'] },
  uiux: { label: 'UI/UX design', mono: 'UX', match: ['\\bui\\s*/\\s*ux\\b', '\\bux\\b', '\\buser experience\\b'] },
  azure: { label: 'Azure', logo: 'azure', match: ['\\bazure\\b'] },
  oci: { label: 'Oracle Cloud', mono: 'OCI', match: ['\\boracle cloud\\b', '\\boci\\b'] },
  postman: { label: 'Postman', mono: 'PM', match: ['\\bpostman\\b'] },
};

// Technologies that often appear in job descriptions but aren't in Sai's portfolio yet.
// The Fit Check reports these as gaps instead of guessing.
export const gapTerms = {
  kubernetes: { label: 'Kubernetes', match: ['\\bkubernetes\\b', '\\bk8s\\b'] },
  terraform: { label: 'Terraform', match: ['\\bterraform\\b'] },
  graphql: { label: 'GraphQL', match: ['\\bgraphql\\b'] },
  golang: { label: 'Go', match: ['\\bgolang\\b', 'CS:\\bGo\\b(?=\\s*(?:,|/|\\)|and\\b|or\\b))'] },
  rust: { label: 'Rust', match: ['\\brust\\b'] },
  cpp: { label: 'C++', match: ['C\\+\\+'] },
  csharp: { label: 'C#', match: ['C#', '\\.net\\b', '\\bdotnet\\b'] },
  ruby: { label: 'Ruby / Rails', match: ['\\bruby\\b', '\\brails\\b'] },
  django: { label: 'Django', match: ['\\bdjango\\b'] },
  fastapi: { label: 'FastAPI', match: ['\\bfastapi\\b'] },
  vue: { label: 'Vue', match: ['\\bvue(?:\\.js|js)?\\b'] },
  svelte: { label: 'Svelte', match: ['\\bsvelte(?:kit)?\\b'] },
  nextjs: { label: 'Next.js', match: ['\\bnext(?:\\.js|js)\\b'] },
  reactnative: { label: 'React Native', match: ['\\breact native\\b'] },
  redux: { label: 'Redux', match: ['\\bredux\\b'] },
  tailwind: { label: 'Tailwind CSS', match: ['\\btailwind\\b'] },
  kafka: { label: 'Kafka', match: ['\\bkafka\\b'] },
  rabbitmq: { label: 'RabbitMQ', match: ['\\brabbitmq\\b'] },
  spark: { label: 'Spark', match: ['\\b(?:apache\\s)?spark\\b', '\\bpyspark\\b'] },
  airflow: { label: 'Airflow', match: ['\\bairflow\\b'] },
  snowflake: { label: 'Snowflake', match: ['\\bsnowflake\\b'] },
  pytorch: { label: 'PyTorch', match: ['\\bpytorch\\b'] },
  langchain: { label: 'LangChain', match: ['\\blangchain\\b'] },
  vectordb: { label: 'Vector databases', match: ['\\bvector (?:db|database|store)s?\\b', '\\bpinecone\\b', '\\bweaviate\\b', '\\bpgvector\\b'] },
  kotlin: { label: 'Kotlin', match: ['\\bkotlin\\b'] },
  scala: { label: 'Scala', match: ['\\bscala\\b'] },
  swiftui: { label: 'SwiftUI', match: ['\\bswift\\s*ui\\b'] },
  express: { label: 'Express', match: ['\\bexpress(?:\\.js|js)?\\b'] },
  nestjs: { label: 'NestJS', match: ['\\bnest(?:\\.js|js)\\b'] },
  dynamodb: { label: 'DynamoDB', match: ['\\bdynamo\\s?db\\b'] },
  cassandra: { label: 'Cassandra', match: ['\\bcassandra\\b'] },
  jenkins: { label: 'Jenkins', match: ['\\bjenkins\\b'] },
  githubactions: { label: 'GitHub Actions', match: ['\\bgithub actions\\b'] },
  jest: { label: 'Jest', match: ['\\bjest\\b'] },
  cypress: { label: 'Cypress', match: ['\\bcypress\\b'] },
  playwright: { label: 'Playwright', match: ['\\bplaywright\\b'] },
  selenium: { label: 'Selenium', match: ['\\bselenium\\b'] },
};

export const skillCategories = [
  { id: 'languages', label: 'Programming languages', icon: 'code', accent: '#e8505b', skills: ['c', 'java', 'python', 'dart', 'swift'] },
  { id: 'frontend', label: 'Frontend', icon: 'layout', accent: '#0a7aff', skills: ['html', 'css', 'bootstrap', 'react', 'angular', 'javascript', 'typescript'] },
  { id: 'backend', label: 'Backend', icon: 'server', accent: '#20a162', skills: ['springboot', 'nodejs', 'flask', 'php'] },
  { id: 'mobile', label: 'Mobile', icon: 'phone', accent: '#8e5cf7', skills: ['flutter', 'android'] },
  { id: 'databases', label: 'Databases', icon: 'database', accent: '#d9468f', skills: ['mysql', 'postgresql', 'sqlite', 'mongodb', 'firebase', 'redis'] },
  { id: 'ai', label: 'AI & machine learning', icon: 'sparkle', accent: '#3b82f6', skills: ['genai', 'llms', 'rag', 'nlp', 'ollama', 'openai', 'huggingface'] },
  { id: 'tools', label: 'DevOps & tools', icon: 'wrench', accent: '#d48a0b', skills: ['git', 'docker', 'aws', 'figma', 'streamlit'] },
];

export const experience = [
  {
    id: 'afficiency',
    company: 'Afficiency',
    title: 'Full Stack Developer',
    type: 'Full-time',
    location: 'New York, USA',
    start: '2024-09',
    end: null,
    summary: 'Front ends, microservices and carrier integrations for an insurtech startup.',
    highlights: [
      { value: '10,000+', label: 'users on web and mobile' },
      { value: '3', label: 'major life-insurance carriers' },
      { value: '50+', label: 'high-priority production issues resolved' },
    ],
    bullets: [
      'Designed and developed responsive user interfaces in React, building a scalable front-end architecture that supports 10,000+ users across web and mobile platforms.',
      'Implemented and maintained microservices in Flask and Spring Boot, using Redis for caching and MySQL for relational data to improve scalability and performance.',
      'Delivered enterprise applications for three major life-insurance carriers and resolved 50+ high-priority production issues through HubSpot, improving UI/UX and back-end workflows.',
      'Used GitLab for version control, CI/CD and code review, streamlining the deployment pipeline and keeping releases reliable.',
    ],
    stack: ['react', 'flask', 'springboot', 'redis', 'mysql', 'microservices', 'gitlab', 'cicd', 'hubspot'],
  },
  {
    id: 'open-avenues',
    company: 'Open Avenues Career Pathways',
    title: 'Student Consultant, Software Engineering',
    type: 'Internship',
    location: 'Chicago, USA',
    start: '2024-02',
    end: '2024-04',
    summary: 'Built the Campus Cooks mobile app with Koodos Labs.',
    bullets: [
      'Designed and developed the Campus Cooks mobile app in Flutter with Koodos Labs, letting students prepare recipes from the ingredients they select in a single tap.',
      'Integrated a Firebase back end for real-time data storage and user authentication.',
      'Designed interfaces in Figma that follow modern design principles.',
    ],
    stack: ['flutter', 'firebase', 'figma', 'dart', 'uiux'],
    project: 'campus-cooks',
  },
  {
    id: 'hexaware',
    company: 'Hexaware Technologies',
    title: 'Software Engineer Intern',
    type: 'Internship',
    location: 'Chicago, USA',
    start: '2023-10',
    end: '2023-12',
    summary: 'Angular single-page apps on Spring Boot and Hibernate.',
    bullets: [
      'Built responsive single-page applications with the modular architecture of Angular.',
      'Combined Hibernate ORM with Spring Boot services for efficient data access and manipulation.',
    ],
    stack: ['angular', 'springboot', 'hibernate', 'typescript', 'java'],
  },
  {
    id: 'ey',
    company: 'Ernst & Young',
    title: 'Software Engineer',
    type: 'Full-time',
    location: 'Chennai, India',
    start: '2021-08',
    end: '2022-06',
    summary: 'Spring Boot microservices and REST APIs across eight internal services.',
    highlights: [{ value: '8', label: 'internal microservices connected through REST APIs' }],
    bullets: [
      'Built scalable microservice applications in Spring Boot and integrated multiple databases, including MySQL and PostgreSQL.',
      'Deployed REST APIs across 8 internal microservices so data flowed cleanly between services.',
      'Used Git with the team to manage changes and resolve conflicts during development.',
      'Designed optimized MySQL schemas and wrote SQL for complex data structures.',
    ],
    stack: ['springboot', 'java', 'mysql', 'postgresql', 'rest', 'microservices', 'git', 'sql'],
  },
];

export const education = [
  {
    id: 'illinois-tech',
    school: 'Illinois Institute of Technology',
    short: 'Illinois Tech',
    degree: 'Master of Computer Science',
    location: 'Chicago, USA',
    start: '2022-08',
    end: '2024-05',
    gpa: '3.7',
    activities: ['Senior TechNews Writer', 'TechNews Photographer', 'Library Student Advisor', 'ACM Member'],
    coursework: [
      'Software Engineering', 'Enterprise Web Applications', 'Algorithms', 'Computer Networks', 'Machine Learning',
      'Big Data', 'Mobile App Development', 'Software Testing & Analysis', 'Advanced Databases', 'Software Project Management',
    ],
  },
];

// cover.type picks an illustration from js/lib/covers.js. media holds real screenshots or outputs.
export const projects = [
  {
    slug: 'repo-vision',
    name: 'Repo Vision',
    kind: 'Data & ML web app',
    year: 2024,
    featured: true,
    tagline: 'Forecasts GitHub activity for popular open-source repositories with three different models.',
    summary: 'A React dashboard that pulls a year of GitHub activity for repositories such as Elasticsearch, OpenAI Python and Angular Google Maps, then forecasts it with LSTM, Prophet and SARIMAX so the models can be compared side by side.',
    built: [
      'A Flask microservice that collects issues, pull requests, commits, branches, releases and contributors through the GitHub API.',
      'A forecasting microservice that trains an LSTM in TensorFlow/Keras and compares it with Prophet and SARIMAX from statsmodels.',
      'Charts rendered with Matplotlib, stored in Google Cloud Storage and shown in a React, Material UI and Highcharts dashboard.',
      'Every service containerized with Docker for Google Cloud Run, with Elasticsearch for indexing issue data.',
    ],
    stack: ['python', 'flask', 'react', 'tensorflow', 'forecasting', 'gcp', 'docker', 'elasticsearch', 'microservices', 'highcharts', 'mui', 'pandas', 'ml'],
    links: [{ type: 'github', label: 'GitHub repo', url: 'https://github.com/saiprasaad/Repo-Vision' }],
    media: [
      { src: 'images/projects/repo-vision-prophet.webp', alt: 'Prophet forecast of issues created per day with a confidence band, generated by Repo Vision', width: 1000, height: 600, caption: 'Prophet forecast generated by the forecasting service' },
      { src: 'images/projects/repo-vision-lstm.webp', alt: 'LSTM prediction plotted against real release activity, generated by Repo Vision', width: 1000, height: 400, caption: 'LSTM predictions against real data' },
    ],
    cover: { type: 'chart', from: '#12306e', to: '#2f6fe0' },
  },
  {
    slug: 'ai-log-summarizer',
    name: 'AI-Powered Log Summarizer',
    kind: 'AI tool',
    year: null,
    featured: true,
    tagline: 'Summarizes application logs with an LLM and posts the summary to Microsoft Teams.',
    summary: 'Integrates AI log summarization with Microsoft Teams, so anomalies surface in real time and incidents get a faster response. Summaries come from an LLM served through Ollama.',
    built: [],
    stack: ['python', 'flask', 'ollama', 'llms', 'teams', 'genai'],
    links: [],
    media: [],
    cover: { type: 'logs', from: '#101521', to: '#26324a' },
  },
  {
    slug: 'youtube-translator',
    name: 'YouTube Translator',
    kind: 'AI web app',
    year: 2024,
    featured: true,
    tagline: 'Paste a YouTube link, pick Spanish or German, and get the video back with a translated voice-over.',
    summary: 'A Streamlit app that chains speech recognition, machine translation and speech synthesis to dub a YouTube video into another language.',
    built: [
      'Downloads the video with pytube and extracts the audio track with MoviePy.',
      'Transcribes speech with OpenAI Whisper, then translates the transcript with the OpenAI API.',
      'Generates the translated voice-over with gTTS and merges it back into the video with MoviePy.',
    ],
    stack: ['python', 'streamlit', 'whisper', 'openai', 'gtts', 'moviepy', 'nlp', 'genai'],
    links: [{ type: 'github', label: 'GitHub repo', url: 'https://github.com/saiprasaad/YouTube-Translator' }],
    media: [],
    cover: { type: 'video', from: '#8f1d1d', to: '#e2561b' },
  },
  {
    slug: 'json-explorer',
    name: 'JSON Explorer',
    kind: 'Web app',
    year: null,
    featured: true,
    tagline: 'Paste JSON, explore it as an interactive graph, and edit it in place.',
    summary: 'An interactive JSON visualization and editing tool built with React Flow and deployed on Netlify.',
    built: [],
    stack: ['react', 'reactflow', 'javascript', 'netlify'],
    links: [{ type: 'demo', label: 'Live demo', url: 'https://jsonexplorer.netlify.app' }],
    media: [],
    cover: { type: 'graph', from: '#2a2470', to: '#5b5bd6' },
  },
  {
    slug: 'campus-cooks',
    name: 'Campus Cooks',
    kind: 'Mobile app',
    year: 2024,
    featured: false,
    tagline: 'Snap a photo of your ingredients and get recipe ideas.',
    summary: 'A Flutter app built with Koodos Labs during the Open Avenues internship. Students photograph what they have, the app recognizes the ingredients and suggests recipes they can make.',
    built: [
      'Camera capture in Flutter, with ingredients recognized by the LogMeal food-recognition API.',
      'Recipe suggestions based on the detected ingredients.',
      'Firebase for real-time data storage and user authentication, and a Figma-designed interface.',
    ],
    stack: ['flutter', 'dart', 'firebase', 'logmeal', 'figma', 'uiux'],
    links: [
      { type: 'github', label: 'GitHub repo', url: 'https://github.com/saiprasaad/Campus-Cooks' },
      { type: 'video', label: 'Demo video', url: 'https://drive.google.com/file/d/1--LbigJaJ-yDcMmW_RtHZHbswS0q7NNn/view?usp=sharing' },
    ],
    media: [],
    cover: { type: 'camera', from: '#a33a0b', to: '#f08a32' },
  },
  {
    slug: 'chicago-streets-harmony',
    name: 'Chicago Streets Harmony',
    kind: 'Mobile app',
    year: 2024,
    featured: false,
    tagline: 'Find the nearest parade, or help someone experiencing homelessness get support.',
    summary: 'A community app for Chicago. The parade locator finds the nearest parade and its details; the helper lets people report someone in need with a photo and GPS location so city services can respond.',
    built: [
      'A Spring Boot REST API that serves event and parade data.',
      'A Flutter app that uses geolocation and geocoding to find the closest parade and share a precise location.',
      'Photo submission for reporting someone who needs assistance.',
    ],
    team: 'Built with Nagarajan Sivakumar',
    stack: ['flutter', 'dart', 'springboot', 'java', 'geolocation', 'rest'],
    links: [{ type: 'github', label: 'GitHub repo', url: 'https://github.com/saiprasaad/Chicago-Streets-Harmony' }],
    media: [],
    cover: { type: 'map', from: '#dfeee6', to: '#c4e0d1' },
  },
  {
    slug: 'asana-automation',
    name: 'Asana Task Automation',
    kind: 'Automation',
    year: null,
    featured: false,
    tagline: 'Creates the day\'s tickets in Asana and keeps them in sync with back-end dashboards.',
    summary: 'Automates daily ticket creation and SQL syncing between Asana and back-end dashboards.',
    built: [],
    stack: ['asana', 'python', 'flask', 'redis', 'mysql', 'sql'],
    links: [],
    media: [],
    cover: { type: 'tasks', from: '#9f1239', to: '#f0607e' },
  },
  {
    slug: 'encryption-module',
    name: 'Encryption & Decryption Module',
    kind: 'Security',
    year: null,
    featured: false,
    tagline: 'AES-CBC encryption shared by a React front end and a Flask back end.',
    summary: 'Implements AES-CBC encryption and decryption in both React and Flask so data stays protected end to end.',
    built: [],
    stack: ['react', 'flask', 'aes', 'javascript', 'python'],
    links: [],
    media: [],
    cover: { type: 'cipher', from: '#0d5c56', to: '#18a597' },
  },
  {
    slug: 'battleships',
    name: 'Battleships',
    kind: 'Mobile game',
    year: 2023,
    featured: false,
    tagline: 'Multiplayer Battleships: place five ships and play people or one of three AI opponents.',
    summary: 'A Flutter client for a multiplayer Battleships game, with APIs for authentication and gameplay.',
    built: [
      'Login with session tokens stored on the device.',
      'A games list: tap to continue a game, swipe to delete it.',
      'Ship placement for five ships, then turn-based play against another person or a random, perfect or one-ship AI.',
    ],
    stack: ['flutter', 'dart', 'flask', 'mysql', 'rest'],
    links: [{ type: 'github', label: 'GitHub repo', url: 'https://github.com/saiprasaad/Battleships' }],
    media: [],
    cover: { type: 'battleship', from: '#0a3b5c', to: '#0a79b8' },
  },
  {
    slug: 'wordle-clone',
    name: 'Wordle Clone',
    kind: 'Mobile game',
    year: 2024,
    featured: false,
    tagline: 'Cross-platform Wordle with a fresh word every game.',
    summary: 'A cross-platform Wordle clone in Flutter. Each game fetches a new five-letter word from the Wordnik API and checks guesses against a dictionary API.',
    built: [
      'Random five-letter words from the Wordnik API.',
      'Guess validation against a dictionary API before a row is accepted.',
      'A custom on-screen keyboard and tile grid.',
    ],
    stack: ['flutter', 'dart', 'rest'],
    links: [{ type: 'github', label: 'GitHub repo', url: 'https://github.com/saiprasaad/Wordle-Clone' }],
    media: [],
    cover: { type: 'wordle', from: '#1b1f24', to: '#353b43' },
  },
];

export const accomplishments = [
  { id: 'best-performer', title: 'Best Performer of the Month', org: 'Afficiency', icon: 'star', tone: 'gold' },
  { id: 'acm-scarlet', title: 'Winner, ACM Scarlet Hackathon', org: 'ACM', icon: 'trophy', tone: 'violet' },
  { id: 'hackmhs-judge', title: 'Judge, HackMHS X Hackathon', org: 'HackMHS', icon: 'gavel', tone: 'blue' },
  { id: 'acm-leetcode', title: 'Winner, LeetCode Challenge', org: 'ACM', icon: 'code', tone: 'green' },
  { id: 'cognizant-star', title: 'Star Performer', org: 'Cognizant Student Club', icon: 'star', tone: 'pink' },
  { id: 'ieee-debugging', title: 'Winner, Debugging Contest', org: 'IEEE Computer Society SBC', icon: 'bug', tone: 'orange' },
];

// Add a `url` to any certification to show a Verify link.
export const certifications = [
  { id: 'azure-ai', title: 'Azure AI Fundamentals', issuer: 'Microsoft', icon: 'sparkle', tone: 'blue', skills: ['azure', 'ml'] },
  { id: 'oci', title: 'Oracle Cloud Infrastructure Foundations Associate', issuer: 'Oracle', icon: 'cloud', tone: 'red', skills: ['oci'] },
  { id: 'cs50', title: "CS50's Introduction to Computer Science", issuer: 'Harvard / edX', icon: 'code', tone: 'crimson', skills: ['c', 'python'] },
  { id: 'umich-web', title: 'Web Development and Coding Specialization', issuer: 'University of Michigan / Coursera', icon: 'layout', tone: 'navy', skills: ['html', 'css', 'javascript'] },
  { id: 'google-genai', title: 'Introduction to Generative AI', issuer: 'Google Cloud / Coursera', icon: 'sparkle', tone: 'green', skills: ['genai', 'gcp'] },
  { id: 'hackerrank', title: 'Certified in C, Java, JavaScript, React and MySQL', issuer: 'HackerRank', icon: 'check', tone: 'emerald', url: 'https://www.hackerrank.com/profile/saiprasaad1999', skills: ['c', 'java', 'javascript', 'react', 'mysql'] },
  { id: 'postman', title: 'Postman Student Expert', issuer: 'Postman', icon: 'send', tone: 'orange', skills: ['postman', 'rest'] },
];

// Finder's top-level folders, in the order visitors care about most.
export const sections = [
  { id: 'about', label: 'About Me', short: 'About', icon: 'user', blurb: 'Who Sai is and what he works on' },
  { id: 'projects', label: 'Projects', short: 'Projects', icon: 'code', blurb: 'Ten projects across web, mobile, AI and data' },
  { id: 'experience', label: 'Experience', short: 'Experience', icon: 'briefcase', blurb: 'Roles at Afficiency, EY and more' },
  { id: 'skills', label: 'Skills', short: 'Skills', icon: 'bolt', blurb: 'Languages, frameworks and tools' },
  { id: 'education', label: 'Education', short: 'Education', icon: 'cap', blurb: 'M.S. Computer Science, Illinois Tech' },
  { id: 'achievements', label: 'Achievements', short: 'Achievements', icon: 'trophy', blurb: 'Awards and certifications' },
  { id: 'contact', label: 'Contact', short: 'Contact', icon: 'mail', blurb: 'Email, LinkedIn and GitHub' },
];

// Finder sidebar tags: quick filters for the projects folder.
export const tags = [
  { skill: 'react', color: '#0a7aff' },
  { skill: 'python', color: '#f5b400' },
  { skill: 'flutter', color: '#2bb3f0' },
  { skill: 'springboot', color: '#34c759' },
  { skill: 'llms', color: '#af52de' },
];

// ---------- Derived facts ----------

const monthIndex = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  return y * 12 + (m - 1);
};

export function nowMonth(date = new Date()) {
  return date.getFullYear() * 12 + date.getMonth();
}

// Calendar months a role spans, counting both end months (the way LinkedIn shows durations).
export function roleMonths(role, date = new Date()) {
  const end = role.end ? monthIndex(role.end) : nowMonth(date);
  return Math.max(1, end - monthIndex(role.start) + 1);
}

// Completed months only: an ongoing role doesn't count the current month yet.
function workedMonths(role, date) {
  if (role.end) return roleMonths(role, date);
  return Math.max(1, nowMonth(date) - monthIndex(role.start));
}

export function experienceMonths({ includeInternships = false, date = new Date() } = {}) {
  return experience
    .filter((r) => includeInternships || r.type === 'Full-time')
    .reduce((sum, r) => sum + workedMonths(r, date), 0);
}

// "almost 3 years", "3+ years", "about 2 years" from full-time months.
export function experiencePhrase(date = new Date()) {
  const months = experienceMonths({ date });
  const years = months / 12;
  const whole = Math.floor(years);
  const frac = years - whole;
  if (frac >= 0.75) return `almost ${whole + 1} years`;
  if (whole < 1) return `${months} months`;
  return `${whole}+ years`;
}

export function aboutParagraphs(date = new Date()) {
  const phrase = experiencePhrase(date);
  return profile.about.map((p) => p.replace('{experience}', phrase));
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatMonth(ym) {
  if (!ym) return 'Present';
  const [y, m] = ym.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

export function formatRange(start, end) {
  return `${formatMonth(start)} – ${end ? formatMonth(end) : 'Present'}`;
}

export function formatDuration(months) {
  const y = Math.floor(months / 12);
  const m = months % 12;
  const parts = [];
  if (y) parts.push(`${y} yr${y > 1 ? 's' : ''}`);
  if (m) parts.push(`${m} mo${m > 1 ? 's' : ''}`);
  return parts.join(' ') || '1 mo';
}

export function skillLabel(id) {
  return skills[id]?.label ?? id;
}

export function listedSkillIds() {
  return skillCategories.flatMap((c) => c.skills);
}

// Where a skill shows up: roles, projects and certifications, most recent first.
export function evidenceFor(skillId) {
  const roles = experience.filter((r) => r.stack.includes(skillId)).map((r) => ({ type: 'role', id: r.id, label: r.company }));
  const projs = projects.filter((p) => p.stack.includes(skillId)).map((p) => ({ type: 'project', id: p.slug, label: p.name }));
  const certs = certifications.filter((c) => (c.skills || []).includes(skillId)).map((c) => ({ type: 'cert', id: c.id, label: c.issuer }));
  return [...roles, ...projs, ...certs];
}

export function projectsUsing(skillId) {
  return projects.filter((p) => p.stack.includes(skillId));
}

export function getProject(slug) {
  return projects.find((p) => p.slug === slug) || null;
}

// A compact, structured description of the portfolio that Folio's backend uses as context.
export function portfolioContext(date = new Date()) {
  const lines = [];
  lines.push(`NAME: ${profile.name} (goes by ${profile.nickname})`);
  lines.push(`ROLE: ${profile.role} at ${profile.company} (${profile.companyBlurb}), ${profile.location}`);
  lines.push(`EXPERIENCE: ${experiencePhrase(date)} full-time, plus two internships`);
  lines.push(`EMAIL: ${profile.email}`);
  lines.push(`LINKS: ${profile.links.map((l) => `${l.label} ${l.url}`).join('; ')}; Resume ${profile.resume.view}`);
  lines.push('');
  lines.push('ABOUT:');
  aboutParagraphs(date).forEach((p) => lines.push(p));
  lines.push('');
  lines.push('EXPERIENCE:');
  experience.forEach((r) => {
    lines.push(`- ${r.title}, ${r.company}, ${r.location} (${formatRange(r.start, r.end)}, ${r.type})`);
    r.bullets.forEach((b) => lines.push(`  * ${b}`));
  });
  lines.push('');
  lines.push('EDUCATION:');
  education.forEach((e) => {
    lines.push(`- ${e.degree}, ${e.school}, ${e.location} (${formatRange(e.start, e.end)}), GPA ${e.gpa}`);
    lines.push(`  Activities: ${e.activities.join(', ')}`);
    lines.push(`  Coursework: ${e.coursework.join(', ')}`);
  });
  lines.push('');
  lines.push('SKILLS:');
  skillCategories.forEach((c) => lines.push(`- ${c.label}: ${c.skills.map(skillLabel).join(', ')}`));
  lines.push('');
  lines.push('PROJECTS:');
  projects.forEach((p) => {
    lines.push(`- ${p.name} (${p.kind}${p.year ? `, ${p.year}` : ''}): ${p.summary}`);
    p.built.forEach((b) => lines.push(`  * ${b}`));
    lines.push(`  Stack: ${p.stack.map(skillLabel).join(', ')}`);
    if (p.team) lines.push(`  ${p.team}`);
    p.links.forEach((l) => lines.push(`  ${l.label}: ${l.url}`));
  });
  lines.push('');
  lines.push('ACCOMPLISHMENTS:');
  accomplishments.forEach((a) => lines.push(`- ${a.title} (${a.org})`));
  lines.push('');
  lines.push('CERTIFICATIONS:');
  certifications.forEach((c) => lines.push(`- ${c.title} (${c.issuer})`));
  return lines.join('\n');
}
