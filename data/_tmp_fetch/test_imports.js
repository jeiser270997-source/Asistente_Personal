// test_imports.js
try {
  const { createToolCallingAgent, AgentExecutor } = require('@langchain/core/utils/function_calling');
  console.log('core/utils/function_calling OK');
} catch(e) { console.log('core/utils err:', e.message.substring(0,60)); }

try {
  const agents = require('@langchain/langgraph/prebuilt');
  console.log('langgraph/prebuilt:', Object.keys(agents).slice(0,5));
} catch(e) { console.log('langgraph err:', e.message.substring(0,60)); }

try {
  const { ChatOpenAI } = require('@langchain/openai');
  const { HumanMessage } = require('@langchain/core/messages');
  const { tool } = require('@langchain/core/tools');
  const { z } = require('zod');
  console.log('core/tools OK');
  console.log('zod:', !!z);
} catch(e) { console.log('core/tools err:', e.message.substring(0,80)); }
