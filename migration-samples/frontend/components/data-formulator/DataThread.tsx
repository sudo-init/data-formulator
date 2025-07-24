'use client'

/**
 * DataThread component - Conversation thread for AI interactions
 * Migrated from original DataThread.tsx to Next.js with Tailwind
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks'
import { dataFormulatorActions, runAgent } from '@/lib/store/slices/dataFormulatorSlice'

// MUI components during migration
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Tooltip,
  Collapse,
  Chip,
  LinearProgress,
} from '@mui/material'
import {
  Send as SendIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'

// Types
interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  metadata?: {
    agentType?: string
    status?: 'ok' | 'error' | 'pending'
    code?: string
    executionTime?: number
  }
}

interface ThreadData {
  id: string
  title: string
  messages: Message[]
  createdAt: string
  updatedAt: string
}

interface DataThreadProps {
  threadId: string
  thread: ThreadData
  className?: string
}

interface DataThreadListProps {
  className?: string
}

// Message Component
const MessageBubble: React.FC<{
  message: Message
  onDelete?: () => void
  onEdit?: (content: string) => void
}> = ({ message, onDelete, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)

  const handleSaveEdit = useCallback(() => {
    if (onEdit && editContent.trim() !== message.content) {
      onEdit(editContent.trim())
    }
    setIsEditing(false)
  }, [editContent, message.content, onEdit])

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <Box className={`
      mb-3 
      ${message.role === 'user' ? 'ml-4' : 'mr-4'}
    `}>
      <Card className={`
        ${message.role === 'user' 
          ? 'bg-blue-50 border-blue-200' 
          : message.role === 'system'
          ? 'bg-gray-50 border-gray-200'
          : 'bg-white border-gray-200'
        }
      `}>
        <CardContent className="pb-2">
          {/* Message header */}
          <Box className="flex items-center justify-between mb-2">
            <Box className="flex items-center space-x-2">
              <Chip
                size="small"
                label={message.role === 'user' ? 'You' : message.role === 'system' ? 'System' : 'AI'}
                className={`
                  ${message.role === 'user' 
                    ? 'bg-blue-100 text-blue-800' 
                    : message.role === 'system'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-green-100 text-green-800'
                  }
                `}
              />
              
              {message.metadata?.agentType && (
                <Chip
                  size="small"
                  variant="outlined"
                  label={message.metadata.agentType}
                  className="text-xs"
                />
              )}
              
              {message.metadata?.status && (
                <Chip
                  size="small"
                  label={message.metadata.status}
                  className={`
                    ${message.metadata.status === 'ok' 
                      ? 'bg-green-100 text-green-800'
                      : message.metadata.status === 'error'
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-yellow-100 text-yellow-800'
                    }
                  `}
                />
              )}
            </Box>
            
            <Box className="flex items-center space-x-1">
              <Typography variant="caption" className="text-gray-500">
                {formatTimestamp(message.timestamp)}
              </Typography>
              
              {message.role === 'user' && (
                <>
                  <Tooltip title="Edit message">
                    <IconButton
                      size="small"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Delete message">
                    <IconButton
                      size="small"
                      onClick={onDelete}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Box>
          </Box>
          
          {/* Message content */}
          {isEditing ? (
            <Box>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                variant="outlined"
                size="small"
                className="mb-2"
              />
              <Box className="flex justify-end space-x-2">
                <Button
                  size="small"
                  onClick={() => {
                    setEditContent(message.content)
                    setIsEditing(false)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleSaveEdit}
                >
                  Save
                </Button>
              </Box>
            </Box>
          ) : (
            <Typography variant="body2" className="whitespace-pre-wrap">
              {message.content}
            </Typography>
          )}
          
          {/* Code block if present */}
          {message.metadata?.code && (
            <Box className="mt-2 p-3 bg-gray-100 rounded border font-mono text-sm overflow-x-auto">
              <pre>{message.metadata.code}</pre>
            </Box>
          )}
          
          {/* Execution time */}
          {message.metadata?.executionTime && (
            <Typography variant="caption" className="text-gray-500 block mt-2">
              Executed in {message.metadata.executionTime.toFixed(2)}s
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

// Single Data Thread Component
export function DataThread({ threadId, thread, className = '' }: DataThreadProps) {
  const dispatch = useAppDispatch()
  const [expanded, setExpanded] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const selectedModel = useAppSelector((state) => state.dataFormulator.selectedModel)
  const sessionId = useAppSelector((state) => state.dataFormulator.sessionId)
  const tables = useAppSelector((state) => state.dataFormulator.tables)

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (expanded && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [thread.messages, expanded])

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || !selectedModel || !sessionId) return

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
    }

    // Add user message to thread
    dispatch(dataFormulatorActions.updateThread({
      id: threadId,
      updates: {
        messages: [...thread.messages, userMessage],
        updatedAt: new Date().toISOString(),
      }
    }))

    setInputValue('')
    setIsLoading(true)

    try {
      // Run AI agent
      const result = await dispatch(runAgent({
        agentType: 'python_data_transform',
        prompt: inputValue.trim(),
        data: {},
        tables,
        modelConfig: selectedModel,
        sessionId,
      })).unwrap()

      // Add AI response
      const aiMessage: Message = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: result.status === 'ok' 
          ? 'Task completed successfully. Check the visualization or data output.'
          : result.error_message || 'An error occurred while processing your request.',
        timestamp: new Date().toISOString(),
        metadata: {
          agentType: result.agent,
          status: result.status as 'ok' | 'error',
          code: result.code,
          executionTime: result.execution_time,
        }
      }

      dispatch(dataFormulatorActions.updateThread({
        id: threadId,
        updates: {
          messages: [...thread.messages, userMessage, aiMessage],
          updatedAt: new Date().toISOString(),
        }
      }))

    } catch (error) {
      // Add error message
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        role: 'system',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        timestamp: new Date().toISOString(),
        metadata: { status: 'error' }
      }

      dispatch(dataFormulatorActions.updateThread({
        id: threadId,
        updates: {
          messages: [...thread.messages, userMessage, errorMessage],
          updatedAt: new Date().toISOString(),
        }
      }))
    } finally {
      setIsLoading(false)
    }
  }, [inputValue, selectedModel, sessionId, threadId, thread.messages, tables, dispatch])

  const handleDeleteMessage = useCallback((messageId: string) => {
    const updatedMessages = thread.messages.filter(msg => msg.id !== messageId)
    dispatch(dataFormulatorActions.updateThread({
      id: threadId,
      updates: {
        messages: updatedMessages,
        updatedAt: new Date().toISOString(),
      }
    }))
  }, [threadId, thread.messages, dispatch])

  const handleEditMessage = useCallback((messageId: string, newContent: string) => {
    const updatedMessages = thread.messages.map(msg => 
      msg.id === messageId ? { ...msg, content: newContent } : msg
    )
    dispatch(dataFormulatorActions.updateThread({
      id: threadId,
      updates: {
        messages: updatedMessages,
        updatedAt: new Date().toISOString(),
      }
    }))
  }, [threadId, thread.messages, dispatch])

  const handleDeleteThread = useCallback(() => {
    dispatch(dataFormulatorActions.deleteThread(threadId))
  }, [threadId, dispatch])

  return (
    <Card className={`thread-item ${className}`}>
      <CardContent className="pb-2">
        <Box 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <Box className="flex-1">
            <Typography variant="subtitle2" className="font-medium truncate">
              {thread.title || 'Untitled Thread'}
            </Typography>
            <Typography variant="caption" className="text-gray-500">
              {thread.messages.length} messages • {new Date(thread.updatedAt).toLocaleDateString()}
            </Typography>
          </Box>
          
          <Box className="flex items-center space-x-1">
            <Tooltip title="Delete thread">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteThread()
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <IconButton size="small">
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>
      </CardContent>
      
      <Collapse in={expanded}>
        <CardContent className="pt-0">
          {/* Messages */}
          <Box className="max-h-96 overflow-y-auto mb-3">
            {thread.messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onDelete={() => handleDeleteMessage(message.id)}
                onEdit={(content) => handleEditMessage(message.id, content)}
              />
            ))}
            <div ref={messagesEndRef} />
          </Box>
          
          {/* Loading indicator */}
          {isLoading && (
            <Box className="mb-3">
              <LinearProgress />
              <Typography variant="caption" className="text-gray-500 block mt-1">
                AI is processing your request...
              </Typography>
            </Box>
          )}
          
          {/* Input area */}
          <Box className="flex space-x-2">
            <TextField
              fullWidth
              placeholder="Ask about your data..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              multiline
              maxRows={3}
              size="small"
              disabled={isLoading}
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading || !selectedModel}
              className="min-w-0 px-3"
            >
              <SendIcon fontSize="small" />
            </Button>
          </Box>
          
          {!selectedModel && (
            <Typography variant="caption" className="text-red-500 block mt-1">
              Please select an AI model to start chatting
            </Typography>
          )}
        </CardContent>
      </Collapse>
    </Card>
  )
}

// Data Thread List Component  
export function DataThreadList({ className = '' }: DataThreadListProps) {
  const dispatch = useAppDispatch()
  const threads = useAppSelector((state) => state.dataFormulator.threads)
  
  const handleCreateNewThread = useCallback(() => {
    dispatch(dataFormulatorActions.addThread({
      title: 'New Analysis',
      messages: [],
    }))
  }, [dispatch])

  const threadEntries = Object.entries(threads)

  return (
    <Box className={`thread-panel ${className}`}>
      <Box className="p-4">
        <Box className="flex items-center justify-between mb-4">
          <Typography variant="h6" className="font-semibold">
            Data Threads
          </Typography>
          
          <Button
            size="small"
            variant="outlined"
            onClick={handleCreateNewThread}
          >
            New Thread
          </Button>
        </Box>
        
        {threadEntries.length === 0 ? (
          <Box className="text-center py-8 text-gray-500">
            <Typography variant="body2" className="mb-2">
              No conversation threads yet
            </Typography>
            <Typography variant="caption">
              Create a thread to start analyzing your data with AI
            </Typography>
          </Box>
        ) : (
          <Box className="space-y-3">
            {threadEntries.map(([threadId, thread]) => (
              <DataThread
                key={threadId}
                threadId={threadId}
                thread={thread}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  )
}