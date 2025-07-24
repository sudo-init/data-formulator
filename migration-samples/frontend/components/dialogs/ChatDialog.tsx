'use client'

/**
 * ChatDialog component - AI conversation history and code display
 * Migrated from original ChatDialog.tsx to Next.js with Tailwind
 */

import React from 'react'

// MUI components during migration
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Card,
  CardContent,
  Box,
  Typography,
  Divider,
} from '@mui/material'

// Types
interface ChatEntry {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatDialogProps {
  code: string // final code generated
  dialog: ChatEntry[]
  open: boolean
  handleCloseDialog: () => void
  title?: string
  className?: string
}

// Code Box Component (simplified version)
const CodeBox: React.FC<{ code: string; language?: string; fontSize?: number }> = ({ 
  code, 
  language = 'python',
  fontSize = 12 
}) => {
  return (
    <Box className="code-box bg-gray-100 rounded-md p-3 my-2">
      <pre 
        className="whitespace-pre-wrap text-sm font-mono text-gray-800 overflow-auto"
        style={{ fontSize: `${fontSize}px` }}
      >
        {code}
      </pre>
    </Box>
  )
}

export function ChatDialog({ 
  code, 
  dialog, 
  open, 
  handleCloseDialog, 
  title = "Data Formulation Chat Log",
  className = '' 
}: ChatDialogProps) {
  
  // Render conversation body
  const renderConversationBody = () => {
    if (!dialog || dialog.length === 0) {
      return (
        <Box className="flex flex-col justify-center items-center py-8 min-h-32">
          <Typography className="text-sm text-gray-500">
            There is no conversation history yet
          </Typography>
        </Box>
      )
    }

    // Filter out system messages and render user/assistant conversation
    const userAssistantDialog = dialog.filter(entry => entry.role !== 'system')

    return (
      <Box className="flex flex-col space-y-3 mt-4 min-h-32 max-h-96 overflow-y-auto">
        {userAssistantDialog.map((chatEntry, idx) => {
          const { role, content } = chatEntry
          let message = content.trimEnd()

          // Role-based styling
          const isUser = role === 'user'
          const cardClasses = isUser 
            ? "bg-blue-50 border-blue-200 ml-8" 
            : "bg-gray-50 border-gray-200 mr-8"
          const roleColor = isUser ? "text-blue-700" : "text-gray-700"

          return (
            <Card 
              key={`chat-dialog-${idx}`}
              className={`min-w-72 max-w-full border ${cardClasses}`}
              variant="outlined"
            >
              <CardContent className="py-2 px-3">
                <Typography className={`text-sm font-medium mb-2 capitalize ${roleColor}`}>
                  {role}
                </Typography>
                
                <Box className="flex flex-row items-start">
                  <Box className="max-w-full flex-1">
                    <Typography className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
                      {message}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )
        })}
      </Box>
    )
  }

  return (
    <Dialog
      open={open}
      onClose={handleCloseDialog}
      maxWidth={false}
      className={className}
      PaperProps={{
        className: "max-w-5xl max-h-screen min-w-80 w-full mx-4"
      }}
    >
      <DialogTitle>
        <Typography variant="h6" className="font-semibold">
          {title}
        </Typography>
      </DialogTitle>
      
      <DialogContent dividers className="overflow-x-auto">
        {/* Transformation Code Section */}
        <Divider className="mb-4">
          <Typography className="text-sm text-gray-500">
            Transformation Code
          </Typography>
        </Divider>
        
        <Box className="max-w-4xl mb-6">
          <CodeBox code={code.trimStart()} language="python" />
        </Box>
        
        {/* Conversation Dialog Section */}
        <Divider className="mb-4">
          <Typography className="text-sm text-gray-500">
            Derivation Dialog
          </Typography>
        </Divider>
        
        {renderConversationBody()}
      </DialogContent>
      
      <DialogActions className="p-4">
        <Button 
          onClick={handleCloseDialog}
          variant="outlined"
          className="px-6"
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// Enhanced Chat Dialog with additional features
export interface EnhancedChatDialogProps extends ChatDialogProps {
  showCopyButton?: boolean
  showDownloadButton?: boolean
  onCopyCode?: () => void
  onDownloadChat?: () => void
}

export function EnhancedChatDialog({
  showCopyButton = true,
  showDownloadButton = false,
  onCopyCode,
  onDownloadChat,
  ...props
}: EnhancedChatDialogProps) {
  
  const handleCopyCode = () => {
    if (navigator.clipboard && props.code) {
      navigator.clipboard.writeText(props.code)
      onCopyCode?.()
    }
  }

  const handleDownloadChat = () => {
    if (props.dialog && props.code) {
      const chatContent = {
        timestamp: new Date().toISOString(),
        code: props.code,
        conversation: props.dialog
      }
      
      const dataStr = JSON.stringify(chatContent, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `chat-log-${Date.now()}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      onDownloadChat?.()
    }
  }

  return (
    <Dialog
      open={props.open}
      onClose={props.handleCloseDialog}
      maxWidth={false}
      className={props.className}
      PaperProps={{
        className: "max-w-5xl max-h-screen min-w-80 w-full mx-4"
      }}
    >
      <DialogTitle>
        <Box className="flex items-center justify-between">
          <Typography variant="h6" className="font-semibold">
            {props.title || "Data Formulation Chat Log"}
          </Typography>
          
          <Box className="flex items-center space-x-2">
            {showCopyButton && props.code && (
              <Button
                size="small"
                variant="outlined"
                onClick={handleCopyCode}
                className="text-xs"
              >
                Copy Code
              </Button>
            )}
            
            {showDownloadButton && (
              <Button
                size="small"
                variant="outlined"
                onClick={handleDownloadChat}
                className="text-xs"
              >
                Download
              </Button>
            )}
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers className="overflow-x-auto">
        {/* Transformation Code Section */}
        <Divider className="mb-4">
          <Typography className="text-sm text-gray-500">
            Transformation Code
          </Typography>
        </Divider>
        
        <Box className="max-w-4xl mb-6">
          <CodeBox code={props.code.trimStart()} language="python" />
        </Box>
        
        {/* Conversation Dialog Section */}
        <Divider className="mb-4">
          <Typography className="text-sm text-gray-500">
            Derivation Dialog
          </Typography>
        </Divider>
        
        {props.dialog && props.dialog.length > 0 ? (
          <Box className="flex flex-col space-y-3 mt-4 min-h-32 max-h-96 overflow-y-auto">
            {props.dialog.filter(entry => entry.role !== 'system').map((chatEntry, idx) => {
              const { role, content } = chatEntry
              const message = content.trimEnd()
              const isUser = role === 'user'
              
              return (
                <Card 
                  key={`chat-dialog-${idx}`}
                  className={`min-w-72 max-w-full border ${
                    isUser ? "bg-blue-50 border-blue-200 ml-8" : "bg-gray-50 border-gray-200 mr-8"
                  }`}
                  variant="outlined"
                >
                  <CardContent className="py-2 px-3">
                    <Typography className={`text-sm font-medium mb-2 capitalize ${
                      isUser ? "text-blue-700" : "text-gray-700"
                    }`}>
                      {role}
                    </Typography>
                    
                    <Typography className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
                      {message}
                    </Typography>
                  </CardContent>
                </Card>
              )
            })}
          </Box>
        ) : (
          <Box className="flex flex-col justify-center items-center py-8 min-h-32">
            <Typography className="text-sm text-gray-500">
              There is no conversation history yet
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions className="p-4">
        <Button 
          onClick={props.handleCloseDialog}
          variant="outlined"
          className="px-6"
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}