# Streaming Debug Guide - Troubleshooting Real-time Responses

## 🔍 Debugging Steps Added

I've added comprehensive debugging to help identify why streaming isn't working. Here's what to check:

## 🖥️ Frontend Console Debugging

### 1. **Request Debugging**

Look for these console logs when you send a message:

```
Starting streaming request to: http://localhost:8000/api/v1/workshop/chat-with-link
Request data: {link_id: "...", message: "...", content: "...", analysis: {...}}
Token exists: true
Token preview: eyJhbGciOiJIUzI1NiIs...
```

### 2. **Response Debugging**

Check for these logs:

```
Response status: 200
Response headers: {content-type: "text/event-stream", ...}
Starting to read streaming response...
```

### 3. **Stream Processing**

Look for these logs:

```
Read chunk: {done: false, valueLength: 123}
Decoded chunk: data: {"chunk": "Hello", "done": false}

Processing lines: ["data: {"chunk": "Hello", "done": false}", ""]
Processing line: data: {"chunk": "Hello", "done": false}
JSON string: {"chunk": "Hello", "done": false}
Parsed JSON: {chunk: "Hello", done: false}
Received chunk: Hello
```

### 4. **LinkChatModal Debugging**

Check for these logs:

```
Starting streaming chat with payload: {...}
Received chunk in LinkChatModal: Hello
Stream completed with response: Complete response text...
```

## 🔧 Backend Logs Debugging

### 1. **Streaming Start**

Look for these logs in the backend terminal:

```
Processing streaming chat message for link [uuid] from user 1
Creating streaming request to OpenAI...
Stream created, starting to process chunks...
```

### 2. **Chunk Processing**

Check for these logs:

```
Processing chunk 1
Yielding content chunk (25 chars): Hello, I can help you with...
Sending chunk 1: 25 characters
```

### 3. **Stream Completion**

Look for these logs:

```
Streaming completed. Total chunks processed: 15
Streaming completed. Total chunks sent: 15, Final response length: 1250
Streaming chat response completed for user 1
```

## 🐛 Common Issues to Check

### 1. **Network Issues**

- **Check if request reaches backend** - Look for "Processing streaming chat message" in backend logs
- **Check response status** - Should be 200, not 401 or 422
- **Check response headers** - Should include `content-type: text/event-stream`

### 2. **Streaming Format Issues**

- **Check chunk format** - Should be `data: {"chunk": "...", "done": false}`
- **Check line endings** - Should have `\n\n` after each data line
- **Check JSON parsing** - Should parse without errors

### 3. **Frontend State Issues**

- **Check streaming state** - `streaming` should be `true` during streaming
- **Check streamingMessage** - Should accumulate chunks
- **Check UI updates** - Should show streaming message with blinking cursor

## 🔧 Troubleshooting Steps

### Step 1: Check Console Logs

1. **Open browser console** (F12)
2. **Send a message** in the link chat
3. **Look for the debugging logs** listed above
4. **Identify where the process stops**

### Step 2: Check Backend Logs

1. **Check backend terminal** for streaming logs
2. **Look for chunk processing** logs
3. **Check for any errors** in the streaming process

### Step 3: Common Fixes

#### If No Request Logs:

- **Check API URL** - Should be `http://localhost:8000/api/v1/workshop/chat-with-link`
- **Check authentication** - Token should exist and be valid
- **Check network** - Request should reach backend

#### If Request Fails:

- **Check response status** - Should be 200
- **Check CORS headers** - Backend should send proper headers
- **Check authentication** - Should not be 401

#### If Streaming Starts But No Chunks:

- **Check backend logs** - Should show chunk processing
- **Check AI service** - Should be generating chunks
- **Check response format** - Should be proper SSE format

#### If Chunks Received But No UI Update:

- **Check streaming state** - Should be `true`
- **Check streamingMessage** - Should accumulate text
- **Check UI rendering** - Should show streaming message

## 🎯 Expected Flow

### Successful Streaming Flow:

1. **Frontend**: Send request with debugging logs
2. **Backend**: Process request and start streaming
3. **Backend**: Generate chunks and send via SSE
4. **Frontend**: Receive and parse chunks
5. **Frontend**: Update UI with streaming text
6. **Backend**: Send final completion message
7. **Frontend**: Add complete message to chat history

### Debugging Checklist:

- [ ] Request reaches backend (backend logs show processing)
- [ ] Response status is 200 (frontend logs show success)
- [ ] Response headers include `text/event-stream`
- [ ] Backend generates chunks (backend logs show chunk processing)
- [ ] Frontend receives chunks (frontend logs show chunk parsing)
- [ ] UI updates with streaming text (streamingMessage state updates)
- [ ] Final message added to chat history (completion callback triggered)

## 🚀 Next Steps

1. **Send a message** and check console logs
2. **Identify where the process fails** using the debugging info
3. **Share the specific error or missing logs** so I can help fix the issue
4. **Once working, we can remove the debugging logs** for production

The comprehensive debugging will help us pinpoint exactly where the streaming process is failing! 🎯
