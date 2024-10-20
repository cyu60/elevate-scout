# Real-time Homelessness Detection App

An innovative homelessness detection application featuring **AI commentary**, **real-time analysis**, and a **probability of homelessness over time**. Built with Next.js, it utilizes SingleStore for real-time data analytics and the LLaVa 1.5 multimodal model hosted on Groq for millisecond latency inference.

## Features

- **AI Commentary**: Real-time AI-generated insights on potential homelessness situations.
- **Live Analysis**: Up-to-the-second analysis of video feeds for signs of homelessness.
- **Homelessness Probability Over Time**: Visual representation of the likelihood of homelessness in the observed area over time.

## Prerequisites

- **Node.js**: Version 14 or higher.
- **npm or Yarn**: For dependency management.
- **SingleStore Account**: For real-time analytics.
- **Groq API Key**: Access to the LLaVa 1.5 model.
- **OpenAI API Key**: For additional AI functionalities.

# Installation

```
npm install
```

# SingleStore Connection Details

- DATABASE_HOST=your-singlestore-host
- DATABASE_USERNAME=your-singlestore-username
- DATABASE_PASSWORD=your-singlestore-password
- DATABASE_NAME=your-singlestore-database-name

# Groq API Key

- GROQ_API_KEY=your-groq-api-key

# OpenAI API Key

- OPENAI_API_KEY=your-openai-api-key

# Running the project

```
npm run dev
```

You can access the project at `localhost:3001`
