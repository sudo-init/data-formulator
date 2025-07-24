'use client'

/**
 * MessageSnackbar component - System messages and notifications display
 * Migrated from original MessageSnackbar.tsx to Next.js with Tailwind
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks'
import { dataFormulatorActions } from '@/lib/store/slices/dataFormulatorSlice'

// MUI components during migration
import {
  Box,
  Button,
  Snackbar,
  IconButton,
  Alert,
  Paper,
  Typography,
  Chip,
  Collapse,
  Divider,
  Tooltip,
} from '@mui/material'
import {
  Close as CloseIcon,
  Info as InfoIcon,
  Assignment as AssignmentIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  ErrorOutline as ErrorOutlineIcon,
  Warning as WarningIcon,
  InfoOutlined as InfoOutlineIcon,
  SignalCellular1Bar as SignalCellular1BarIcon,
  SignalCellular2Bar as SignalCellular2BarIcon,
  SignalCellular3Bar as SignalCellular3BarIcon,
} from '@mui/icons-material'

// Types
export interface Message {
  type: "success" | "info" | "error" | "warning"
  component: string // the component that generated the message
  timestamp: number
  value: string
  detail?: string // error details
  code?: string // if this message is related to a code error, include code as well
}

interface Challenge {
  tableId: string
  challenges: Array<{
    text: string
    difficulty: 'easy' | 'medium' | 'hard'
  }>
}

interface GroupedMessage extends Message {
  count: number
  originalIndex: number
}

export function MessageSnackbar() {
  const dispatch = useAppDispatch()
  
  // Redux state
  const challenges = useAppSelector((state) => state.dataFormulator.activeChallenges || [])
  const messages = useAppSelector((state) => state.dataFormulator.messages || [])
  const displayedMessageIdx = useAppSelector((state) => state.dataFormulator.displayedMessageIdx || 0)
  const tables = useAppSelector((state) => state.dataFormulator.tables)

  // Local state  
  const [openLastMessage, setOpenLastMessage] = useState(false)
  const [latestMessage, setLatestMessage] = useState<Message | undefined>()
  const [openChallenge, setOpenChallenge] = useState(true)
  const [openMessages, setOpenMessages] = useState(false)
  const [expandedMessages, setExpandedMessages] = useState<string[]>([])

  // Ref for auto-scrolling messages
  const messagesScrollRef = useRef<HTMLDivElement>(null)

  // Auto-show new messages
  useEffect(() => {
    if (displayedMessageIdx < messages.length) {
      setOpenLastMessage(true)
      setLatestMessage(messages[displayedMessageIdx])
      dispatch(dataFormulatorActions.setDisplayedMessageIndex(displayedMessageIdx + 1))
    }
  }, [messages, displayedMessageIdx, dispatch])

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesScrollRef.current?.scrollTo({ 
      top: messagesScrollRef.current.scrollHeight,
      behavior: 'smooth' 
    })
  }, [messages, openMessages])

  // Event handlers
  const handleClose = useCallback((event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return
    setOpenLastMessage(false)
    setLatestMessage(undefined)
  }, [])

  const handleClearMessages = useCallback(() => {
    dispatch(dataFormulatorActions.clearMessages())
    dispatch(dataFormulatorActions.setDisplayedMessageIndex(0))
    setOpenMessages(false)
  }, [dispatch])

  const toggleExpandMessage = useCallback((timestamp: string) => {
    setExpandedMessages(prev => 
      prev.includes(timestamp) 
        ? prev.filter(t => t !== timestamp)
        : [...prev, timestamp]
    )
  }, [])

  // Utility functions
  const formatTimestamp = (timestamp: number) => {
    const timestampMs = timestamp < 1e12 ? timestamp * 1000 : timestamp
    return new Date(timestampMs).toLocaleString('en-US', { 
      hour: "2-digit", 
      minute: "2-digit", 
      hour12: false
    })
  }

  // Group consecutive duplicate messages
  const groupedMessages: GroupedMessage[] = []
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    const key = `${msg.value}|${msg.detail || ''}|${msg.code || ''}|${msg.type}`
    
    const lastGroup = groupedMessages[groupedMessages.length - 1]
    const lastKey = lastGroup ? `${lastGroup.value}|${lastGroup.detail || ''}|${lastGroup.code || ''}|${lastGroup.type}` : null
    
    if (lastKey === key) {
      // Same as previous message, increment count and update timestamp if newer
      lastGroup.count++
      if (msg.timestamp > lastGroup.timestamp) {
        lastGroup.timestamp = msg.timestamp
      }
    } else {
      // Different message, create new group
      groupedMessages.push({
        ...msg,
        count: 1,
        originalIndex: i
      })
    }
  }

  // Find active challenge for current table
  const challenge = challenges.find(c => 
    Object.values(tables).some(t => t.id === c.tableId)
  )

  const getSeverityIcon = (type: string) => {
    switch (type) {
      case "error": return <ErrorOutlineIcon sx={{fontSize: 16, mr: 0.5, color: 'error.main'}} />
      case "warning": return <WarningIcon sx={{fontSize: 16, mr: 0.5, color: 'warning.main'}} />
      case "info": return <InfoOutlineIcon sx={{fontSize: 16, mr: 0.5, color: 'info.main'}} />
      case "success": return <CheckCircleIcon sx={{fontSize: 16, mr: 0.5, color: 'success.main'}} />
      default: return <InfoOutlineIcon sx={{fontSize: 16, mr: 0.5, color: 'info.main'}} />
    }
  }

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return <SignalCellular1BarIcon sx={{fontSize: 16, mr: 0.5}} />
      case 'medium': return <SignalCellular2BarIcon sx={{fontSize: 16, mr: 0.5}} />
      case 'hard': return <SignalCellular3BarIcon sx={{fontSize: 16, mr: 0.5}} />
      default: return <SignalCellular1BarIcon sx={{fontSize: 16, mr: 0.5}} />
    }
  }

  return (
    <Box className="message-snackbar">
      {/* Floating action buttons */}
      {challenges.length > 0 && (
        <Tooltip placement="left" title="View challenges">
          <IconButton 
            color="warning"
            className="fixed bottom-14 right-2 z-50 animate-pulse"
            onClick={() => setOpenChallenge(true)}
            sx={{
              animation: challenges.length > 0 ? 'glow 1.5s ease-in-out infinite alternate' : 'none',
              '@keyframes glow': {
                from: {
                  boxShadow: '0 0 5px #fff, 0 0 10px #fff, 0 0 15px #ed6c02'
                },
                to: {
                  boxShadow: '0 0 10px #fff, 0 0 20px #fff, 0 0 30px #ed6c02'
                }
              }
            }}
          >
            <AssignmentIcon />
          </IconButton>
        </Tooltip>
      )}
      
      <Tooltip placement="left" title="View system messages">
        <IconButton 
          className="fixed bottom-4 right-2 z-50"
          onClick={() => setOpenMessages(true)}
        >
          <InfoIcon />
        </IconButton>
      </Tooltip>

      {/* Challenges Snackbar */}
      {challenge && (
        <Snackbar
          open={openChallenge}
          anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
          sx={{maxWidth: '400px'}}
        >
          <Paper elevation={3} className="w-full p-4 border border-gray-200 rounded-lg">
            <Box className="flex justify-between items-center mb-3">
              <Typography className="text-xs text-gray-600">
                Visualization challenges for{' '}
                <Box component="span" className="text-blue-600 font-bold">
                  {challenge.tableId}
                </Box>
              </Typography>
              <IconButton
                size="small"
                onClick={() => setOpenChallenge(false)}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            
            <Box className="space-y-2">
              {challenge.challenges.map((ch, j) => (
                <Typography 
                  key={j} 
                  className={`text-xs flex items-center ${
                    ch.difficulty === 'easy' ? 'text-green-600'
                    : ch.difficulty === 'medium' ? 'text-yellow-600' 
                    : 'text-red-600'
                  }`}
                >
                  {getDifficultyIcon(ch.difficulty)}
                  [{ch.difficulty}] {ch.text}
                </Typography>
              ))}
            </Box>
          </Paper>
        </Snackbar>
      )}

      {/* Messages Panel Snackbar */}
      <Snackbar
        open={openMessages}
        anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
        sx={{maxWidth: '500px', maxHeight: '70vh'}}
      >
        <Paper elevation={3} className="w-full min-w-80 flex flex-col py-2">
          {/* Header */}
          <Box className="flex items-center px-3 mb-2">
            <Typography className="text-xs text-gray-600 flex-1">
              System messages ({messages.length})
            </Typography>
            
            <Tooltip title="Clear all messages">
              <IconButton
                size="small"
                color="warning"
                onClick={handleClearMessages}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <IconButton
              size="small"
              onClick={() => setOpenMessages(false)}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Messages List */}
          <Box 
            ref={messagesScrollRef}
            className="overflow-auto flex-1 max-h-96"
          >
            {messages.length === 0 && (
              <Typography className="text-xs text-gray-500 italic p-2 text-center">
                There are no messages yet
              </Typography>
            )}
            
            {groupedMessages.map((msg, index) => (
              <Alert 
                key={index} 
                icon={false} 
                severity={msg.type} 
                className="mb-1 py-1 px-2 bg-white bg-opacity-50"
              >
                <Box className="flex items-center">
                  {getSeverityIcon(msg.type)}
                  
                  <Typography className="text-xs flex-1">
                    [{formatTimestamp(msg.timestamp)}] ({msg.component}) - {msg.value}
                  </Typography>
                  
                  {msg.count > 1 && (
                    <Chip 
                      variant="outlined"
                      label={`x${msg.count}`}
                      color={msg.type as any}
                      size="small"
                      className="h-4 text-xs ml-2"
                    />
                  )}
                  
                  {(msg.detail || msg.code) && (
                    <IconButton 
                      size="small"
                      onClick={() => toggleExpandMessage(msg.timestamp.toString())}
                      className="p-0 ml-1"
                    >
                      {expandedMessages.includes(msg.timestamp.toString()) ? (
                        <ExpandLessIcon fontSize="small" />
                      ) : (
                        <ExpandMoreIcon fontSize="small" />
                      )}
                    </IconButton>
                  )}
                </Box>
                
                {/* Expandable details */}
                {(msg.detail || msg.code) && (
                  <Collapse 
                    in={expandedMessages.includes(msg.timestamp.toString())} 
                    className="ml-6 mt-2"
                  >
                    {msg.detail && (
                      <>
                        <Divider className="text-xs opacity-70 mb-2">
                          [details]
                        </Divider>
                        <Typography className="text-xs bg-gray-50 p-2 rounded">
                          {msg.detail}
                        </Typography>
                      </>
                    )}
                    
                    {msg.code && (
                      <>
                        <Divider className="text-xs opacity-70 my-2">
                          [generated code]
                        </Divider>
                        <Box className="bg-gray-100 p-2 rounded text-xs">
                          <pre className="whitespace-pre-wrap break-words text-xs">
                            {msg.code.split('\n').filter(line => line.trim() !== '').join('\n')}
                          </pre>
                        </Box>
                      </>
                    )}
                  </Collapse>
                )}
              </Alert>
            ))}
          </Box>
        </Paper>
      </Snackbar>

      {/* Latest Message Auto-popup Snackbar */}
      {latestMessage && (
        <Snackbar
          open={openLastMessage}
          autoHideDuration={latestMessage.type === "error" ? 20000 : 10000}
          anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
          onClose={handleClose}
        >
          <Alert 
            onClose={handleClose} 
            severity={latestMessage.type} 
            className="max-w-96 max-h-96 overflow-auto"
          >
            <Typography className="text-xs">
              <strong>
                [{formatTimestamp(latestMessage.timestamp)}] ({latestMessage.component})
              </strong>{' '}
              {latestMessage.value}
            </Typography>
            
            {latestMessage.detail && (
              <>
                <Divider className="text-xs opacity-70 my-2">
                  [details]
                </Divider>
                <Box className="bg-gray-50 p-2 rounded">
                  <Typography className="text-xs">
                    {latestMessage.detail}
                  </Typography>
                </Box>
              </>
            )}
            
            {latestMessage.code && (
              <>
                <Divider className="text-xs opacity-70 my-2">
                  [generated code]
                </Divider>
                <Box className="bg-gray-100 p-2 rounded text-xs">
                  <pre className="whitespace-pre-wrap break-words">
                    {latestMessage.code.split('\n').filter(line => line.trim() !== '').join('\n')}
                  </pre>
                </Box>
              </>
            )}
          </Alert>
        </Snackbar>
      )}
    </Box>
  )
}