export type Domain = 'ai_knowledge' | 'data_competency' | 'automation';

export interface Option {
  id: string;
  label: string;
  points: number;
  tags?: string[];
}

export interface Question {
  id: string;
  domain: Domain;
  type: 'fast' | 'proof';
  prompt: string;
  options: Option[];
}

export const QUESTIONS: Question[] = [
  {
    id: 'q1',
    domain: 'ai_knowledge',
    type: 'fast',
    prompt: 'What is prompt engineering in the context of AI tools like ChatGPT?',
    options: [
      { id: 'a', label: 'A programming language for AI', points: 0 },
      { id: 'b', label: 'The process of writing clear instructions to get better AI outputs', points: 10 },
      { id: 'c', label: 'A type of software engineering', points: 3 },
      { id: 'd', label: 'I\'m not sure', points: 0 },
    ],
  },
  {
    id: 'q2',
    domain: 'ai_knowledge',
    type: 'fast',
    prompt: 'How often do you use AI tools in your daily work?',
    options: [
      { id: 'a', label: 'Never or rarely', points: 0 },
      { id: 'b', label: 'Occasionally (once or twice a week)', points: 4 },
      { id: 'c', label: 'Regularly (most days)', points: 7 },
      { id: 'd', label: 'Constantly (multiple times per day)', points: 10 },
    ],
  },
  {
    id: 'q3',
    domain: 'ai_knowledge',
    type: 'fast',
    prompt: 'When writing a prompt for an AI tool, which approach is most effective?',
    options: [
      { id: 'a', label: 'Keep it as short as possible', points: 2 },
      { id: 'b', label: 'Be specific about context, desired output format, and constraints', points: 10 },
      { id: 'c', label: 'Use complex technical jargon', points: 0 },
      { id: 'd', label: 'Just type whatever comes to mind', points: 1 },
    ],
  },
  {
    id: 'q4',
    domain: 'ai_knowledge',
    type: 'fast',
    prompt: 'What does "AI hallucination" mean?',
    options: [
      { id: 'a', label: 'When AI creates visual effects', points: 0 },
      { id: 'b', label: 'When AI generates false or incorrect information presented as fact', points: 10 },
      { id: 'c', label: 'When AI malfunctions', points: 3 },
      { id: 'd', label: 'I don\'t know', points: 0 },
    ],
  },
  {
    id: 'q5',
    domain: 'ai_knowledge',
    type: 'fast',
    prompt: 'Which type of information should you NEVER input into public AI tools like ChatGPT?',
    options: [
      { id: 'a', label: 'General knowledge questions', points: 0 },
      { id: 'b', label: 'Customer names, financial data, passwords, or proprietary company information', points: 10 },
      { id: 'c', label: 'Grammar and spelling checks', points: 0 },
      { id: 'd', label: 'Any information is fine to share', points: 0 },
    ],
  },
  {
    id: 'q6',
    domain: 'ai_knowledge',
    type: 'fast',
    prompt: 'What is an appropriate use of AI for customer communications?',
    options: [
      { id: 'a', label: 'Use AI output directly without any review', points: 0 },
      { id: 'b', label: 'Use AI to draft content, then review and edit before sending', points: 10 },
      { id: 'c', label: 'Never use AI for customer communications', points: 5 },
      { id: 'd', label: 'Only use AI for internal communications', points: 7 },
    ],
  },
  {
    id: 'q7',
    domain: 'ai_knowledge',
    type: 'fast',
    prompt: 'What is bias in AI systems?',
    options: [
      { id: 'a', label: 'When AI prefers certain users over others', points: 2 },
      { id: 'b', label: 'When AI produces unfair outcomes based on factors like race, gender, or age due to biased training data', points: 10 },
      { id: 'c', label: 'When AI makes errors', points: 1 },
      { id: 'd', label: 'I\'m not familiar with this concept', points: 0 },
    ],
  },
  {
    id: 'q8',
    domain: 'ai_knowledge',
    type: 'proof',
    prompt: 'You need to summarize a 50-page confidential contract. What should you do?',
    options: [
      { id: 'a', label: 'Upload the entire document to ChatGPT for summarization', points: 0 },
      { id: 'b', label: 'Use a company-approved secure AI tool or summarize manually', points: 10 },
      { id: 'c', label: 'Copy-paste excerpts into ChatGPT', points: 2 },
      { id: 'd', label: 'Ask a colleague to use AI for you', points: 0 },
    ],
  },
  {
    id: 'q9',
    domain: 'ai_knowledge',
    type: 'proof',
    prompt: 'You notice AI-generated content contains outdated information. What do you do?',
    options: [
      { id: 'a', label: 'Use it anyway since AI is usually accurate', points: 0 },
      { id: 'b', label: 'Verify all AI outputs against current sources before using', points: 10 },
      { id: 'c', label: 'Just update the obviously wrong parts', points: 4 },
      { id: 'd', label: 'Mention in a footnote that AI was used', points: 2 },
    ],
  },
  {
    id: 'q10',
    domain: 'ai_knowledge',
    type: 'proof',
    prompt: 'Your manager asks you to create a hiring rubric using AI. How do you ensure fairness?',
    options: [
      { id: 'a', label: 'Use the AI output as-is', points: 1 },
      { id: 'b', label: 'Review for bias, test with diverse candidates, get legal/HR approval', points: 10 },
      { id: 'c', label: 'Just change a few words', points: 2 },
      { id: 'd', label: 'Share it with team for feedback', points: 6 },
    ],
  },
  {
    id: 'q11',
    domain: 'ai_knowledge',
    type: 'fast',
    prompt: 'What are "guardrails" in AI usage?',
    options: [
      { id: 'a', label: 'Physical barriers around AI servers', points: 0 },
      { id: 'b', label: 'Policies and controls to ensure safe and ethical AI use', points: 10 },
      { id: 'c', label: 'Software updates for AI tools', points: 2 },
      { id: 'd', label: 'I\'m not sure', points: 0 },
    ],
  },
  {
    id: 'q12',
    domain: 'ai_knowledge',
    type: 'fast',
    prompt: 'Who is responsible for the accuracy of AI-generated work outputs?',
    options: [
      { id: 'a', label: 'The AI company', points: 0 },
      { id: 'b', label: 'No one, it\'s automated', points: 0 },
      { id: 'c', label: 'The employee using the AI tool', points: 10 },
      { id: 'd', label: 'My manager', points: 2 },
    ],
  },
  {
    id: 'q13',
    domain: 'ai_knowledge',
    type: 'fast',
    prompt: 'What should you do before using a new AI tool for work tasks?',
    options: [
      { id: 'a', label: 'Just start using it if it\'s free', points: 0 },
      { id: 'b', label: 'Check company policy, get manager approval, ensure data security', points: 10 },
      { id: 'c', label: 'Ask a colleague if they use it', points: 4 },
      { id: 'd', label: 'Read online reviews', points: 2 },
    ],
  },
  {
    id: 'q14',
    domain: 'ai_knowledge',
    type: 'proof',
    prompt: 'A client asks if you used AI to create their proposal. How do you respond?',
    options: [
      { id: 'a', label: 'Deny using AI', points: 0 },
      { id: 'b', label: 'Be transparent: explain AI was used as a tool but all content was reviewed and customized', points: 10 },
      { id: 'c', label: 'Ignore the question', points: 0 },
      { id: 'd', label: 'Say it doesn\'t matter', points: 1 },
    ],
  },
  {
    id: 'q15',
    domain: 'ai_knowledge',
    type: 'proof',
    prompt: 'You discover a coworker is using AI to generate financial forecasts without validation. What should you do?',
    options: [
      { id: 'a', label: 'Nothing, it\'s not my responsibility', points: 0 },
      { id: 'b', label: 'Report to manager or compliance team; this poses significant risk', points: 10 },
      { id: 'c', label: 'Tell the coworker they should stop', points: 6 },
      { id: 'd', label: 'Use the same approach since they\'re doing it', points: 0 },
    ],
  },
  {
    id: 'q16',
    domain: 'data_competency',
    type: 'fast',
    prompt: 'What is PII (Personally Identifiable Information)?',
    options: [
      { id: 'a', label: 'Public Internet Information', points: 0 },
      { id: 'b', label: 'Information that can identify a specific individual (name, email, SSN, etc.)', points: 10 },
      { id: 'c', label: 'Professional Industry Information', points: 0 },
      { id: 'd', label: 'I don\'t know', points: 0 },
    ],
  },
  {
    id: 'q17',
    domain: 'data_competency',
    type: 'fast',
    prompt: 'How comfortable are you working with data in spreadsheets or databases?',
    options: [
      { id: 'a', label: 'Not comfortable at all', points: 0 },
      { id: 'b', label: 'Basic data entry and simple formulas', points: 4 },
      { id: 'c', label: 'Can create pivot tables, use VLOOKUP, and analyze trends', points: 7 },
      { id: 'd', label: 'Advanced: can use SQL, create complex analyses, and build dashboards', points: 10 },
    ],
  },
  {
    id: 'q18',
    domain: 'data_competency',
    type: 'fast',
    prompt: 'What does data privacy mean in a business context?',
    options: [
      { id: 'a', label: 'Keeping your personal files private', points: 2 },
      { id: 'b', label: 'Protecting customer and company data from unauthorized access and misuse', points: 10 },
      { id: 'c', label: 'Using passwords', points: 3 },
      { id: 'd', label: 'I\'m not sure', points: 0 },
    ],
  },
  {
    id: 'q19',
    domain: 'data_competency',
    type: 'fast',
    prompt: 'When sharing customer data internally, what should you do?',
    options: [
      { id: 'a', label: 'Share with anyone who asks', points: 0 },
      { id: 'b', label: 'Only share with authorized personnel who need it for their job', points: 10 },
      { id: 'c', label: 'Post in a public channel for transparency', points: 0 },
      { id: 'd', label: 'Email it to my personal account for easy access', points: 0 },
    ],
  },
  {
    id: 'q20',
    domain: 'data_competency',
    type: 'fast',
    prompt: 'What is data quality?',
    options: [
      { id: 'a', label: 'How much data you have', points: 1 },
      { id: 'b', label: 'How accurate, complete, consistent, and timely your data is', points: 10 },
      { id: 'c', label: 'The storage format of data', points: 2 },
      { id: 'd', label: 'I\'m not familiar with this term', points: 0 },
    ],
  },
  {
    id: 'q21',
    domain: 'data_competency',
    type: 'fast',
    prompt: 'Have you ever used data to make or support a business decision?',
    options: [
      { id: 'a', label: 'No, I rely on intuition', points: 0 },
      { id: 'b', label: 'Occasionally with basic metrics', points: 5 },
      { id: 'c', label: 'Regularly using reports and analytics', points: 8 },
      { id: 'd', label: 'Frequently, I create analyses to drive decisions', points: 10 },
    ],
  },
  {
    id: 'q22',
    domain: 'data_competency',
    type: 'fast',
    prompt: 'What should you do if you discover a data error in a report?',
    options: [
      { id: 'a', label: 'Ignore it if it\'s small', points: 0 },
      { id: 'b', label: 'Correct it immediately and notify anyone who received the incorrect report', points: 10 },
      { id: 'c', label: 'Wait and see if anyone notices', points: 0 },
      { id: 'd', label: 'Fix it quietly without telling anyone', points: 3 },
    ],
  },
  {
    id: 'q23',
    domain: 'data_competency',
    type: 'proof',
    prompt: 'You need to analyze sales trends. Your dataset has duplicate entries and missing values. What do you do?',
    options: [
      { id: 'a', label: 'Proceed with analysis as-is', points: 0 },
      { id: 'b', label: 'Clean the data first: remove duplicates, handle missing values appropriately', points: 10 },
      { id: 'c', label: 'Delete all incomplete rows', points: 4 },
      { id: 'd', label: 'Ask someone else to do it', points: 2 },
    ],
  },
  {
    id: 'q24',
    domain: 'data_competency',
    type: 'proof',
    prompt: 'A marketing vendor requests a list of customer emails. What do you do?',
    options: [
      { id: 'a', label: 'Send it immediately to be helpful', points: 0 },
      { id: 'b', label: 'Verify they have proper authorization, check contracts and privacy policies, get manager approval', points: 10 },
      { id: 'c', label: 'Send a partial list to test', points: 2 },
      { id: 'd', label: 'Forward the request to IT', points: 6 },
    ],
  },
  {
    id: 'q25',
    domain: 'data_competency',
    type: 'proof',
    prompt: 'You notice customer data being stored in multiple conflicting spreadsheets. What should you do?',
    options: [
      { id: 'a', label: 'Keep using whichever one I have', points: 2 },
      { id: 'b', label: 'Alert management and propose consolidating to a single source of truth', points: 10 },
      { id: 'c', label: 'Create my own master version', points: 4 },
      { id: 'd', label: 'Nothing, this is normal', points: 0 },
    ],
  },
  {
    id: 'q26',
    domain: 'data_competency',
    type: 'fast',
    prompt: 'What is a data breach?',
    options: [
      { id: 'a', label: 'When data storage runs out', points: 0 },
      { id: 'b', label: 'Unauthorized access to or exposure of sensitive data', points: 10 },
      { id: 'c', label: 'When systems go offline', points: 1 },
      { id: 'd', label: 'I\'m not sure', points: 0 },
    ],
  },
  {
    id: 'q27',
    domain: 'data_competency',
    type: 'proof',
    prompt: 'You accidentally email customer data to the wrong recipient. What should you do?',
    options: [
      { id: 'a', label: 'Hope they don\'t open it', points: 0 },
      { id: 'b', label: 'Immediately notify your manager, security team, and follow company breach protocol', points: 10 },
      { id: 'c', label: 'Send a follow-up asking them to delete it', points: 4 },
      { id: 'd', label: 'Don\'t mention it if no one notices', points: 0 },
    ],
  },
  {
    id: 'q28',
    domain: 'data_competency',
    type: 'fast',
    prompt: 'Can you explain what a dashboard or KPI (Key Performance Indicator) is?',
    options: [
      { id: 'a', label: 'No, I\'m not familiar', points: 0 },
      { id: 'b', label: 'Yes, it\'s a visual display of important business metrics', points: 10 },
      { id: 'c', label: 'Something related to finance', points: 3 },
      { id: 'd', label: 'A type of report', points: 5 },
    ],
  },
  {
    id: 'q29',
    domain: 'automation',
    type: 'fast',
    prompt: 'Have you ever automated a repetitive task in your work?',
    options: [
      { id: 'a', label: 'No, I do everything manually', points: 0 },
      { id: 'b', label: 'Yes, using basic tools like email rules or templates', points: 5 },
      { id: 'c', label: 'Yes, using formulas, macros, or simple scripts', points: 8 },
      { id: 'd', label: 'Yes, I regularly build workflows and integrations', points: 10 },
    ],
  },
  {
    id: 'q30',
    domain: 'automation',
    type: 'fast',
    prompt: 'What tasks in your role could benefit from automation?',
    options: [
      { id: 'a', label: 'I haven\'t thought about it', points: 2 },
      { id: 'b', label: 'I have a few ideas but haven\'t tried implementing them', points: 5 },
      { id: 'c', label: 'I\'ve identified several tasks and have started automating some', points: 8 },
      { id: 'd', label: 'I actively look for automation opportunities and implement them regularly', points: 10 },
    ],
  },
  {
    id: 'q31',
    domain: 'automation',
    type: 'fast',
    prompt: 'What is workflow automation?',
    options: [
      { id: 'a', label: 'Working faster', points: 1 },
      { id: 'b', label: 'Using technology to complete tasks without manual intervention', points: 10 },
      { id: 'c', label: 'Scheduling meetings', points: 0 },
      { id: 'd', label: 'I\'m not sure', points: 0 },
    ],
  },
  {
    id: 'q32',
    domain: 'automation',
    type: 'fast',
    prompt: 'How comfortable are you with no-code/low-code automation tools (Zapier, Make, Power Automate)?',
    options: [
      { id: 'a', label: 'Never heard of them', points: 0 },
      { id: 'b', label: 'Heard of them but never used', points: 3 },
      { id: 'c', label: 'Have experimented with them', points: 7 },
      { id: 'd', label: 'Use them regularly to build automations', points: 10 },
    ],
  },
  {
    id: 'q33',
    domain: 'automation',
    type: 'fast',
    prompt: 'Before automating a process, what should you do first?',
    options: [
      { id: 'a', label: 'Start building the automation right away', points: 2 },
      { id: 'b', label: 'Document the current process and identify pain points', points: 10 },
      { id: 'c', label: 'Ask IT to do it', points: 1 },
      { id: 'd', label: 'Copy what other companies do', points: 3 },
    ],
  },
  {
    id: 'q34',
    domain: 'automation',
    type: 'proof',
    prompt: 'You spend 2 hours each week copying data from emails into a spreadsheet. What should you do?',
    options: [
      { id: 'a', label: 'Continue doing it manually', points: 0 },
      { id: 'b', label: 'Research automation options like email parsing or integration tools', points: 10 },
      { id: 'c', label: 'Delegate to someone else', points: 3 },
      { id: 'd', label: 'Do it less frequently', points: 2 },
    ],
  },
  {
    id: 'q35',
    domain: 'automation',
    type: 'proof',
    prompt: 'An automated workflow you created starts producing errors. What do you do?',
    options: [
      { id: 'a', label: 'Turn it off and go back to manual process', points: 3 },
      { id: 'b', label: 'Investigate the error, fix the workflow, and test thoroughly before reactivating', points: 10 },
      { id: 'c', label: 'Ignore small errors', points: 0 },
      { id: 'd', label: 'Ask someone else to fix it', points: 4 },
    ],
  },
  {
    id: 'q36',
    domain: 'automation',
    type: 'fast',
    prompt: 'What is an API in the context of business automation?',
    options: [
      { id: 'a', label: 'A type of software', points: 2 },
      { id: 'b', label: 'A way for different applications to communicate and share data', points: 10 },
      { id: 'c', label: 'A programming language', points: 1 },
      { id: 'd', label: 'I don\'t know', points: 0 },
    ],
  },
  {
    id: 'q37',
    domain: 'automation',
    type: 'proof',
    prompt: 'Your team asks you to help streamline the monthly reporting process. Where do you start?',
    options: [
      { id: 'a', label: 'Suggest buying new software', points: 3 },
      { id: 'b', label: 'Map current process, identify bottlenecks, propose specific automation opportunities', points: 10 },
      { id: 'c', label: 'Say it\'s fine as-is', points: 0 },
      { id: 'd', label: 'Ask IT to handle it', points: 4 },
    ],
  },
  {
    id: 'q38',
    domain: 'automation',
    type: 'fast',
    prompt: 'When is automation NOT a good solution?',
    options: [
      { id: 'a', label: 'For tasks requiring human judgment or creativity', points: 10 },
      { id: 'b', label: 'Automation is always good', points: 0 },
      { id: 'c', label: 'For repetitive tasks', points: 2 },
      { id: 'd', label: 'I\'m not sure', points: 0 },
    ],
  },
  {
    id: 'q39',
    domain: 'automation',
    type: 'proof',
    prompt: 'You automated client onboarding but now clients complain it feels impersonal. What do you do?',
    options: [
      { id: 'a', label: 'Keep the automation, efficiency matters most', points: 2 },
      { id: 'b', label: 'Remove all automation', points: 3 },
      { id: 'c', label: 'Balance automation with personal touchpoints; automate admin tasks but keep human interaction for key moments', points: 10 },
      { id: 'd', label: 'Ignore the complaints', points: 0 },
    ],
  },
  {
    id: 'q40',
    domain: 'automation',
    type: 'fast',
    prompt: 'How do you measure the success of an automation project?',
    options: [
      { id: 'a', label: 'If it works, it\'s successful', points: 3 },
      { id: 'b', label: 'Time saved, error reduction, cost savings, user satisfaction', points: 10 },
      { id: 'c', label: 'Number of steps automated', points: 5 },
      { id: 'd', label: 'Don\'t need to measure', points: 0 },
    ],
  },
];

export const DOMAIN_WEIGHTS: Record<Domain, number> = {
  ai_knowledge: 0.40,
  data_competency: 0.35,
  automation: 0.25,
};
