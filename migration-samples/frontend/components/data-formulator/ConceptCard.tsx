'use client'

/**
 * ConceptCard component - Draggable field cards for data transformation
 * Migrated from original ConceptCard.tsx to Next.js with Tailwind
 */

import React, { useState, useCallback, useEffect } from 'react'
import { useDrag } from 'react-dnd'
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks'
import { dataFormulatorActions, runAgent } from '@/lib/store/slices/dataFormulatorSlice'

// MUI components during migration
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Menu,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  Divider,
  LinearProgress,
  Checkbox,
  FormControlLabel,
  ButtonGroup,
  Autocomplete,
} from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  PrecisionManufacturing as PrecisionManufacturingIcon,
  ForkRight as ForkRightIcon,
  ZoomIn as ZoomInIcon,
  HideSource as HideSourceIcon,
  Numbers as NumberIcon,
  TextFields as TextIcon,
  CalendarToday as DateIcon,
  CheckBox as BooleanIcon,
  AutoMode as AutoIcon,
} from '@mui/icons-material'

// Types
export interface FieldItem {
  id: string
  name: string
  type: 'string' | 'number' | 'date' | 'boolean' | 'auto'
  domain: any[]
  description?: string
  source: 'original' | 'custom' | 'derived'
  tableRef: string
  transform?: ConceptTransformation
  semanticType?: string
  levels?: { values: any[], reason: string }
}

export interface ConceptTransformation {
  parentIDs: string[]
  code: string
  description: string
}

interface ConceptCardProps {
  field: FieldItem
  className?: string
}

// Utility functions
const getIconFromType = (type: string) => {
  switch (type) {
    case 'number': return <NumberIcon fontSize="inherit" />
    case 'string': return <TextIcon fontSize="inherit" />
    case 'date': return <DateIcon fontSize="inherit" />
    case 'boolean': return <BooleanIcon fontSize="inherit" />
    case 'auto': return <AutoIcon fontSize="inherit" />
    default: return <AutoIcon fontSize="inherit" />
  }
}

const checkConceptIsEmpty = (field: FieldItem) => {
  return field.name === "" &&
    ((field.source === "derived" && !field.transform?.description && field.transform?.code === "")
      || (field.source === "custom"))
}

const genFreshDerivedConcept = (parentIDs: string[], tableRef: string): FieldItem => {
  return {
    id: `concept-${Date.now()}`,
    name: "",
    type: "string",
    source: "derived",
    domain: [],
    tableRef: tableRef,
    transform: { parentIDs: parentIDs, code: "", description: "" }
  }
}

// Concept Re-Apply Button Component
const ConceptReApplyButton: React.FC<{
  field: FieldItem
  focusedTable: any
  handleLoading: (loading: boolean) => void
}> = ({ field, focusedTable, handleLoading }) => {
  const dispatch = useAppDispatch()
  const [codePreview, setCodePreview] = useState<string>(field.transform?.code || "")
  const [tableRowsPreview, setTableRowsPreview] = useState<any[]>([])
  const [applicationDialogOpen, setApplicationDialogOpen] = useState<boolean>(false)

  const conceptShelfItems = useAppSelector((state) => state.dataFormulator.conceptShelfItems)
  const selectedModel = useAppSelector((state) => state.dataFormulator.selectedModel)

  const inputFields = field.transform?.parentIDs.map(pid => {
    const parentConcept = conceptShelfItems.find(f => f.id === pid)
    return { name: parentConcept?.name || '' }
  }) || []

  const handleGeneratePreview = useCallback(async () => {
    if (!selectedModel) return
    
    handleLoading(true)

    try {
      const result = await dispatch(runAgent({
        agentType: 'python_data_transform',
        prompt: field.transform?.description || '',
        data: {
          inputFields,
          inputData: { name: focusedTable.id, rows: focusedTable.rows },
          outputName: field.name
        },
        tables: { [focusedTable.id]: focusedTable },
        modelConfig: selectedModel,
        sessionId: 'concept-reapply',
      })).unwrap()

      if (result.status === 'ok' && result.content.rows) {
        setTableRowsPreview(result.content.rows)
        setCodePreview(result.code || '')
        setApplicationDialogOpen(true)
      }
    } catch (error) {
      console.error('Failed to generate preview:', error)
    } finally {
      handleLoading(false)
    }
  }, [field, focusedTable, selectedModel, inputFields, dispatch, handleLoading])

  const handleApply = useCallback(() => {
    dispatch(dataFormulatorActions.extendTableWithNewFields({
      tableId: focusedTable.id,
      values: tableRowsPreview.map(r => r[field.name]),
      columnName: field.name,
      previousName: undefined,
      parentIDs: field.transform?.parentIDs || []
    }))
  }, [dispatch, focusedTable.id, tableRowsPreview, field])

  return (
    <>
      <Tooltip title={`Apply to ${focusedTable.displayId}`}>
        <IconButton size="small" color="primary" onClick={handleGeneratePreview}>
          <PrecisionManufacturingIcon fontSize="inherit" />
        </IconButton>
      </Tooltip>
      
      <Dialog 
        open={applicationDialogOpen} 
        onClose={() => setApplicationDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Preview: apply concept{' '}
          <Typography color="primary" component="span" sx={{ fontSize: "inherit" }}>
            {field.name}
          </Typography>{' '}
          to{' '}
          <Typography color="primary" component="span" sx={{ fontSize: "inherit" }}>
            {focusedTable.displayId}
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          <Typography sx={{ fontSize: 12, marginBottom: 1 }}>
            Transformation code
          </Typography>
          <Box className="p-3 bg-gray-100 rounded-md mb-4">
            <pre className="text-xs text-gray-800 whitespace-pre-wrap">
              {codePreview.trim()}
            </pre>
          </Box>
          
          <Typography sx={{ fontSize: 12, marginBottom: 1 }}>
            Preview of the applied concept
          </Typography>
          <Box className="max-h-96 overflow-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  {tableRowsPreview.length > 0 && Object.keys(tableRowsPreview[0]).map(key => (
                    <th key={key} className="border p-2 text-left font-medium">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRowsPreview.slice(0, 15).map((row, index) => (
                  <tr key={index} className="border-b">
                    {Object.values(row).map((value: any, cellIndex) => (
                      <td key={cellIndex} className="border p-2 max-w-32 truncate">
                        {String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => {
            setApplicationDialogOpen(false)
            setTableRowsPreview([])
            setCodePreview("")
          }}>
            Cancel
          </Button>
          <Button 
            variant="contained"
            onClick={() => {
              setApplicationDialogOpen(false)
              setTableRowsPreview([])
              setCodePreview("")
              handleApply()
            }}
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

// Main ConceptCard Component
export function ConceptCard({ field, className = '' }: ConceptCardProps) {
  const dispatch = useAppDispatch()
  
  // Redux state
  const conceptShelfItems = useAppSelector((state) => state.dataFormulator.conceptShelfItems)
  const tables = useAppSelector((state) => state.dataFormulator.tables)
  const focusedTableId = useAppSelector((state) => state.dataFormulator.focusedTableId)
  
  const focusedTable = Object.values(tables).find(t => t.id === focusedTableId)
  
  // Local state
  const [editMode, setEditMode] = useState(field.name === "" ? true : false)
  const [isLoading, setIsLoading] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  // Drag functionality
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "concept-card",
    item: { type: 'concept-card', fieldID: field.id, source: "conceptShelf" },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
      handlerId: monitor.getHandlerId(),
    }),
  }))

  // Event handlers
  const handleDeleteConcept = useCallback((conceptID: string) => {
    dispatch(dataFormulatorActions.deleteConceptItemByID(conceptID))
  }, [dispatch])

  const handleUpdateConcept = useCallback((concept: FieldItem) => {
    dispatch(dataFormulatorActions.updateConceptItems(concept))
  }, [dispatch])

  const handleLoading = useCallback((loading: boolean) => {
    setIsLoading(loading)
  }, [])

  const handleDTypeClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }, [])

  const handleDTypeClose = useCallback(() => {
    setAnchorEl(null)
  }, [])

  const handleUpdateDtype = useCallback((dtype: string) => {
    const newConcept = { ...field, type: dtype as any }
    handleUpdateConcept(newConcept)
    handleDTypeClose()
  }, [field, handleUpdateConcept, handleDTypeClose])

  // Style calculations
  const opacity = isDragging ? 0.3 : 1
  const cursorStyle = isDragging ? "grabbing" : "grab"
  
  const getBackgroundColor = () => {
    switch (field.source) {
      case "original": return "bg-blue-100 border-blue-300"
      case "custom": return "bg-purple-100 border-purple-300"  
      case "derived": return "bg-green-100 border-green-300"
      default: return "bg-gray-100 border-gray-300"
    }
  }

  // Action buttons
  const editOption = field.source === "derived" && (
    <Tooltip title="Edit">
      <IconButton 
        size="small" 
        color="primary"
        onClick={() => {
          setEditMode(!editMode)
          dispatch(dataFormulatorActions.setFocusedTable(field.tableRef))
        }}
      >
        <EditIcon fontSize="inherit" />
      </IconButton>
    </Tooltip>
  )

  const deriveOption = (field.source === "derived" || field.source === "original") && (
    <Tooltip title="Derive new concept">
      <IconButton 
        size="small"
        color="primary"
        disabled={Object.values(tables).find(t => t.id === field.tableRef)?.virtual != undefined}
        onClick={() => {
          if (conceptShelfItems.filter(f => 
            f.source === "derived" && 
            f.name === "" &&
            f.transform?.parentIDs.includes(field.id)
          ).length > 0) {
            return
          }
          handleUpdateConcept(genFreshDerivedConcept([field.id], field.tableRef))
        }}
      >
        <ForkRightIcon fontSize="inherit" sx={{ transform: "rotate(90deg)" }} />
      </IconButton>
    </Tooltip>
  )

  const deleteOption = field.source !== "original" && (
    <Tooltip title="Delete">
      <IconButton 
        size="small"
        color="primary"
        disabled={conceptShelfItems.filter(f => 
          f.source === "derived" && 
          f.transform?.parentIDs.includes(field.id)
        ).length > 0}
        onClick={() => handleDeleteConcept(field.id)}
      >
        <DeleteIcon fontSize="inherit" />
      </IconButton>
    </Tooltip>
  )

  const reApplyOption = focusedTable && 
    field.source === "derived" && 
    focusedTable.id !== field.tableRef && 
    !focusedTable.names.includes(field.name) &&
    field.transform?.parentIDs.every(pid => 
      focusedTable.names.includes(
        conceptShelfItems.find(f => f.id === pid)?.name || ''
      )
    ) && (
      <ConceptReApplyButton 
        field={field} 
        focusedTable={focusedTable} 
        handleLoading={handleLoading} 
      />
    )

  const cleanupOption = focusedTable && 
    field.source === "derived" && 
    focusedTableId !== field.tableRef &&
    field.transform?.parentIDs.every(pid => 
      focusedTable.names.includes(
        conceptShelfItems.find(f => f.id === pid)?.name || ''
      )
    ) && 
    focusedTable.names.includes(field.name) && (
      <Tooltip title={`Remove ${field.name} from ${focusedTable.displayId}`}>
        <IconButton 
          size="small" 
          color="primary"
          onClick={() => {
            dispatch(dataFormulatorActions.removeDerivedField({
              tableId: focusedTableId as string,
              fieldId: field.id
            }))
          }}
        >
          <HideSourceIcon fontSize="inherit" />
        </IconButton>
      </Tooltip>
    )

  const TypeList = ['string', 'number', 'date', 'boolean', 'auto']

  const typeIconMenu = (
    <div>
      <Tooltip title={`${field.type} type`}>
        <IconButton 
          size="small" 
          color="primary"
          onClick={handleDTypeClick}
          className="p-1"
        >
          {getIconFromType(field.type)}
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleDTypeClose}
      >
        {TypeList.map((t, i) => (
          <MenuItem 
            key={i}
            dense 
            onClick={() => handleUpdateDtype(t)} 
            selected={t === field.type}
            className="text-sm"
          >
            <Box className="flex items-center space-x-2">
              {getIconFromType(t)}
              <span>{t}</span>
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </div>
  )

  const fieldNameEntry = field.name !== "" ? (
    <Typography className="text-sm ml-1 truncate flex-1">
      {field.name}
    </Typography>
  ) : (
    <Typography className="text-xs ml-1 text-gray-500 italic">
      new concept
    </Typography>
  )

  const cardProps = {
    className: `
      concept-card min-w-16 relative transition-all duration-200
      ${getBackgroundColor()}
      ${editMode ? 'shadow-lg' : 'shadow-sm'}
      ${className}
    `,
    style: { 
      opacity, 
      cursor: cursorStyle,
      marginLeft: '3px'
    }
  }

  const cardContent = (
    <Card {...cardProps} ref={field.name ? drag : undefined}>
      {/* Loading overlay */}
      {isLoading && (
        <Box className="absolute inset-0 z-20 flex items-center justify-center bg-white bg-opacity-80">
          <LinearProgress className="w-full h-full opacity-20" />
        </Box>
      )}

      {/* Card header */}
      <Box className="p-2 relative">
        <Box className="flex items-center justify-between min-h-7">
          <Box className="flex items-center flex-1 min-w-0">
            {typeIconMenu}
            {fieldNameEntry}
            {field.semanticType && (
              <Typography className="text-xs ml-2 italic text-gray-600 whitespace-nowrap">
                -- {field.semanticType}
              </Typography>
            )}
          </Box>

          {/* Action buttons */}
          <Box className="flex items-center ml-2">
            <Box className="flex items-center bg-white bg-opacity-95 rounded">
              {deleteOption}
              {deriveOption}
              {editOption}
            </Box>
            
            {(reApplyOption || cleanupOption) && (
              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            )}
            
            <Box className="flex items-center">
              {reApplyOption}
              {cleanupOption}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Edit mode content */}
      {editMode && field.source === "derived" && (
        <CardContent className="pt-0">
          <DerivedConceptForm 
            concept={field}
            handleUpdateConcept={handleUpdateConcept}
            handleDeleteConcept={handleDeleteConcept}
            turnOffEditMode={() => setEditMode(false)}
          />
        </CardContent>
      )}
    </Card>
  )
}

// Derived Concept Form Component  
const DerivedConceptForm: React.FC<{
  concept: FieldItem
  handleUpdateConcept: (concept: FieldItem) => void
  handleDeleteConcept: (conceptID: string) => void
  turnOffEditMode?: () => void
}> = ({ concept, handleUpdateConcept, handleDeleteConcept, turnOffEditMode }) => {
  const dispatch = useAppDispatch()
  
  // Redux state
  const conceptShelfItems = useAppSelector((state) => state.dataFormulator.conceptShelfItems)
  const tables = useAppSelector((state) => state.dataFormulator.tables)
  const selectedModel = useAppSelector((state) => state.dataFormulator.selectedModel)

  // Form state
  const [name, setName] = useState(concept.name)
  const [dtype, setDtype] = useState(concept.name === "" ? "auto" : concept.type as string)
  const [transformCode, setTransformCode] = useState<string>(concept.transform?.code || "")
  const [transformDesc, setTransformDesc] = useState<string>(concept.transform?.description || "")
  const [transformParentIDs, setTransformParentIDs] = useState<string[]>(concept.transform?.parentIDs || [])
  const [tempExtTable, setTempExtTable] = useState<{tableRef: string, rows: any[]} | undefined>(undefined)
  const [codeGenInProgress, setCodeGenInProgress] = useState<boolean>(false)
  const [codeDialogOpen, setCodeDialogOpen] = useState<boolean>(false)

  // Get affiliated table
  const affiliatedTableId = conceptShelfItems.find(f => f.id === concept.transform?.parentIDs[0])?.tableRef
  const parentConcepts = transformParentIDs.map(parentID => 
    conceptShelfItems.find(c => c.id === parentID)
  ).filter(Boolean) as FieldItem[]

  // Handle code generation
  const handleGenerateCode = useCallback(async () => {
    if (!transformDesc.trim() || !selectedModel || parentConcepts.length === 0) return

    setCodeGenInProgress(true)

    try {
      const inputTable = Object.values(tables).find(t => parentConcepts[0].tableRef === t.id)
      if (!inputTable) return

      const result = await dispatch(runAgent({
        agentType: 'python_data_transform',
        prompt: transformDesc,
        data: {
          inputFields: parentConcepts.map(c => ({ name: c.name })),
          inputData: { name: inputTable.id, rows: inputTable.rows },
          outputName: name
        },
        tables: { [inputTable.id]: inputTable },
        modelConfig: selectedModel,
        sessionId: 'concept-derive',
      })).unwrap()

      if (result.status === 'ok') {
        setTransformCode(result.code || '')
        setTempExtTable({
          tableRef: parentConcepts[0].tableRef,
          rows: result.content.rows || []
        })
      }
    } catch (error) {
      console.error('Failed to generate code:', error)
      setTransformCode("")
    } finally {
      setCodeGenInProgress(false)
    }
  }, [transformDesc, selectedModel, parentConcepts, name, tables, dispatch])

  // Check if form has changes
  const checkDerivedConceptDiff = () => {
    const nameTypeNeq = (concept.name !== name || concept.type !== dtype)
    return (nameTypeNeq ||
      concept.transform?.code !== transformCode ||
      concept.transform?.description !== transformDesc ||
      concept.transform?.parentIDs.toString() !== transformParentIDs.toString())
  }

  // Validation
  const saveDisabledMsg = []
  if (name === "" || conceptShelfItems.some(f => f.name === name && f.id !== concept.id)) {
    saveDisabledMsg.push("concept name is empty or exists")
  }
  if (concept.source === "derived" && transformCode === "") {
    saveDisabledMsg.push("transformation is not specified")
  }

  // Handle save
  const handleSave = useCallback(() => {
    const tmpConcept = { ...concept }
    tmpConcept.name = name
    tmpConcept.type = dtype as any
    tmpConcept.transform = concept.transform ? {
      parentIDs: transformParentIDs,
      code: transformCode,
      description: transformDesc
    } : undefined

    if (tempExtTable) {
      dispatch(dataFormulatorActions.extendTableWithNewFields({
        tableId: tempExtTable.tableRef,
        values: tempExtTable.rows.map(r => r[name]),
        columnName: name,
        previousName: concept.name,
        parentIDs: transformParentIDs
      }))
    }

    if (turnOffEditMode) {
      turnOffEditMode()
    }
    handleUpdateConcept(tmpConcept)
  }, [concept, name, dtype, transformParentIDs, transformCode, transformDesc, tempExtTable, dispatch, turnOffEditMode, handleUpdateConcept])

  const handleCancel = useCallback(() => {
    setName(concept.name)
    setDtype(concept.type)

    if (checkConceptIsEmpty(concept)) {
      handleDeleteConcept(concept.id)
    }
    if (turnOffEditMode) {
      turnOffEditMode()
    }
  }, [concept, handleDeleteConcept, turnOffEditMode])

  return (
    <Box className="space-y-4">
      {/* Name field */}
      <TextField
        fullWidth
        label="Concept name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        size="small"
        error={name === "" || conceptShelfItems.some(f => f.name === name && f.id !== concept.id)}
        helperText={conceptShelfItems.some(f => f.name === name && f.id !== concept.id) ? "This name already exists" : ""}
      />

      {/* Parent fields selection */}
      <FormControl fullWidth size="small">
        <InputLabel>Derive from fields:</InputLabel>
        <Select
          multiple
          value={transformParentIDs}
          label="Derive from fields:"
          onChange={(event) => {
            const value = event.target.value
            if (Array.isArray(value) && value.length > 0) {
              setTransformParentIDs(value)
            }
          }}
          renderValue={(selected) => (
            <Box className="flex flex-wrap gap-1">
              {selected.map(conceptID => {
                const conceptItem = conceptShelfItems.find(f => f.id === conceptID)
                return (
                  <Chip
                    key={conceptID}
                    size="small"
                    label={conceptItem?.name}
                    variant="outlined"
                    className="text-xs"
                  />
                )
              })}
            </Box>
          )}
        >
          {conceptShelfItems
            .filter(t => t.name !== "" && t.tableRef === affiliatedTableId)
            .map(t => (
              <MenuItem key={t.id} value={t.id} className="text-sm">
                <Checkbox 
                  size="small" 
                  checked={transformParentIDs.indexOf(t.id) > -1} 
                />
                {t.name}
              </MenuItem>
            ))}
        </Select>
      </FormControl>

      {/* Transformation description */}
      <TextField
        fullWidth
        multiline
        rows={2}
        label="Transformation description"
        value={transformDesc}
        onChange={(e) => setTransformDesc(e.target.value)}
        placeholder={`Derive ${name} from ${parentConcepts.map(c => c.name).join(", ")}`}
        size="small"
      />

      {/* Generate button */}
      <Button
        variant="contained"
        onClick={handleGenerateCode}
        disabled={!transformDesc.trim() || !selectedModel || codeGenInProgress}
        startIcon={codeGenInProgress ? <LinearProgress /> : <PrecisionManufacturingIcon />}
        fullWidth
      >
        {codeGenInProgress ? 'Generating...' : 'Generate Transformation'}
      </Button>

      {/* Preview results */}
      {tempExtTable && tempExtTable.rows.length > 0 && (
        <Box>
          <Typography className="text-xs text-gray-600 mb-2">
            Transformation result on sample data
          </Typography>
          <Box className="max-h-48 overflow-auto border rounded">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  {tempExtTable.rows.length > 0 && Object.keys(tempExtTable.rows[0]).map(key => (
                    <th key={key} className="p-2 text-left font-medium border-b">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tempExtTable.rows.slice(0, 5).map((row, index) => (
                  <tr key={index} className="border-b">
                    {Object.values(row).map((value: any, cellIndex) => (
                      <td key={cellIndex} className="p-2 truncate max-w-24">
                        {String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </Box>
      )}

      {/* Code preview */}
      {transformCode && (
        <Box>
          <Typography className="text-xs text-gray-600 mb-2">
            Transformation code
          </Typography>
          <Box className="p-3 bg-gray-100 rounded text-xs max-h-32 overflow-auto">
            <pre className="whitespace-pre-wrap">{transformCode.trim()}</pre>
          </Box>
        </Box>
      )}

      {/* Action buttons */}
      <Box className="flex justify-end space-x-2">
        <Button
          size="small"
          onClick={() => setCodeDialogOpen(true)}
          disabled={!transformCode}
        >
          <ZoomInIcon fontSize="small" />
        </Button>
        
        <Button
          size="small"
          color="error"
          onClick={() => handleDeleteConcept(concept.id)}
          disabled={conceptShelfItems.filter(f => 
            f.source === "derived" && 
            f.transform?.parentIDs.includes(concept.id)
          ).length > 0}
        >
          <DeleteIcon fontSize="small" />
        </Button>
        
        <Button size="small" variant="outlined" onClick={handleCancel}>
          Cancel
        </Button>
        
        <Button 
          size="small" 
          variant={checkDerivedConceptDiff() ? "contained" : "outlined"}
          disabled={saveDisabledMsg.length > 0 || !checkDerivedConceptDiff()}
          onClick={handleSave}
        >
          Save
        </Button>
      </Box>

      {/* Full-screen code dialog */}
      <Dialog 
        open={codeDialogOpen} 
        onClose={() => setCodeDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Transformations from{' '}
          <Typography component="span" color="secondary">
            {parentConcepts.map(c => c.name).join(", ")}
          </Typography>{' '}
          to{' '}
          <Typography component="span" color="primary">
            {name}
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          <Box className="space-y-4">
            {tempExtTable && (
              <Box>
                <Typography className="text-sm font-medium mb-2">
                  Transformation result on sample data
                </Typography>
                <Box className="max-h-80 overflow-auto border rounded">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {tempExtTable.rows.length > 0 && Object.keys(tempExtTable.rows[0]).map(key => (
                          <th key={key} className="p-3 text-left font-medium border-b">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tempExtTable.rows.map((row, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          {Object.values(row).map((value: any, cellIndex) => (
                            <td key={cellIndex} className="p-3 max-w-48 truncate">
                              {String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              </Box>
            )}
            
            <Box>
              <Typography className="text-sm font-medium mb-2">
                Transformation code
              </Typography>
              <Box className="p-4 bg-gray-100 rounded max-h-80 overflow-auto">
                <pre className="text-sm whitespace-pre-wrap">{transformCode.trim()}</pre>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setCodeDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}