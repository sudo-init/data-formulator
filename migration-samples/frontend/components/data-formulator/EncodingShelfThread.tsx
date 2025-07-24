/**
 * EncodingShelfThread - Thread view showing encoding shelf workflow and triggers
 * Migrated from original EncodingShelfThread.tsx to Next.js with TypeScript
 */

'use client'

import { FC, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { DataFormulatorState, dfActions, dfSelectors, fetchCodeExpl, fetchFieldSemanticType, generateFreshChart } from '@/lib/store/slices/dataFormulatorSlice'

import {
    Box,
    Typography,
    Button,
    CircularProgress,
    IconButton,
    Tooltip,
    Collapse,
    Stack,
    Card,
    ListItemIcon,
} from '@mui/material'

import React from 'react'

import { EncodingItem, ConceptTransformation, Chart, FieldItem, Trigger } from "@/lib/types/componentTypes"

import _ from 'lodash'

import { createDictTable, DictTable } from "@/lib/types/componentTypes"
import { VegaEmbed } from '@/lib/utils/vegaUtils'

import { getTriggers, getUrls, assembleVegaChart, resolveChartFields } from '@/lib/utils/chartUtils'

import { getChartTemplate } from '@/lib/constants/ChartTemplates'
import { checkChartAvailability, generateChartSkeleton } from './VisualizationView'
import TableRowsIcon from '@mui/icons-material/TableRowsOutlined'
import InsightsIcon from '@mui/icons-material/Insights'
import AnchorIcon from '@mui/icons-material/Anchor'
import SouthIcon from '@mui/icons-material/South'

import { AppDispatch } from '@/lib/store/store'

import { EncodingShelfCard, TriggerCard } from './EncodingShelfCard'
import ChangeCircleOutlinedIcon from '@mui/icons-material/ChangeCircleOutlined'
import { Type } from '@/lib/data/types'

// Property and state of an encoding shelf
export interface EncodingShelfThreadProps { 
    chartId: string,
}

export let ChartElementFC: FC<{chart: Chart, tableRows: any[], boxWidth?: number, boxHeight?: number}> = function({chart, tableRows, boxWidth, boxHeight}) {

    const conceptShelfItems = useSelector((state: DataFormulatorState) => state.conceptShelfItems)

    let WIDTH = boxWidth || 120
    let HEIGHT = boxHeight || 80

    let chartTemplate = getChartTemplate(chart.chartType)

    let available = checkChartAvailability(chart, conceptShelfItems, tableRows)

    if (chart.chartType == "Auto") {
        return <Box sx={{ position: "relative", display: "flex", flexDirection: "column", margin: 'auto', color: 'darkgray' }}>
            <InsightsIcon fontSize="large"/>
        </Box>
    }

    if (!available || chart.chartType == "Table") {
        return <Box sx={{ margin: "auto" }} >
            {generateChartSkeleton(chartTemplate?.icon, 64, 64)}
        </Box>
    } 

    // if (chart.chartType == "Table") {
    //     return renderTableChart(chart, conceptShelfItems, tableRows);
    // }

    // prepare the chart to be rendered
    let assembledChart = assembleVegaChart(chart.chartType, chart.encodingMap, conceptShelfItems, tableRows)
    assembledChart["background"] = "transparent"
    // chart["autosize"] = {
    //     "type": "fit",
    //     "contains": "padding"
    // };

    const id = `chart-thumbnail-${chart.id}-${(Math.random() + 1).toString(36).substring(7)}`
    const element = <Box id={id} sx={{ margin: "auto", backgroundColor: chart.saved ? "rgba(255,215,0,0.05)" : "white" }}></Box>

    // Temporary fix, down sample the dataset
    if (assembledChart["data"]["values"].length > 5000) {
        let values = assembledChart["data"]["values"]
        assembledChart = (({ data, ...o }) => o)(assembledChart)

        let getRandom = (seed: number) => {
            let x = Math.sin(seed++) * 10000
            return x - Math.floor(x)
        }
        let getRandomSubarray = (arr: any[], size: number) => {
            let shuffled = arr.slice(0), i = arr.length, temp, index
            while (i--) {
                index = Math.floor((i + 1) * getRandom(233 * i + 888))
                temp = shuffled[index]
                shuffled[index] = shuffled[i]
                shuffled[i] = temp
            }
            return shuffled.slice(0, size)
        }
        assembledChart["data"] = { "values": getRandomSubarray(values, 5000) }
    }

    assembledChart['config'] = {
        "axis": {"labelLimit": 30}
    }

    VegaEmbed('#' + id, assembledChart, { actions: false, renderer: "canvas" }).then(function (result) {
        // Access the Vega view instance (https://vega.github.io/vega/docs/api/view/) as result.view
        if (result.view.container()?.getElementsByTagName("canvas")) {
            let comp = result.view.container()?.getElementsByTagName("canvas")[0]

            // Doesn't seem like width & height are actual numbers here on Edge bug
            // let width = parseInt(comp?.style.width as string);
            // let height = parseInt(comp?.style.height as string);
            if (comp) {
                const { width, height } = comp.getBoundingClientRect()
                //console.log(`THUMB: width = ${width} height = ${height}`);

                if (width > WIDTH || height > HEIGHT) {
                    let ratio = width / height
                    let fixedWidth = width
                    if (ratio * HEIGHT < width) {
                        fixedWidth = ratio * HEIGHT
                    }
                    if (fixedWidth > WIDTH) {
                        fixedWidth = WIDTH
                    }
                    //console.log("THUMB: width or height are oversized");
                    //console.log(`THUMB: new width = ${fixedWidth}px height = ${fixedWidth / ratio}px`)
                    comp?.setAttribute("style", 
                        `max-width: ${WIDTH}px; max-height: ${HEIGHT}px; width: ${Math.round(fixedWidth)}px; height: ${Math.round(fixedWidth / ratio)}px; `)
                }
            } else {
                console.log("THUMB: Could not get Canvas HTML5 element")
            }
        }
    }).catch((reason) => {
        // console.log(reason)
        // console.error(reason)
    })

    return element
}

export const EncodingShelfThread: FC<EncodingShelfThreadProps> = function ({ chartId }) {

    const tables = useSelector((state: DataFormulatorState) => state.tables)
    let allCharts = useSelector(dfSelectors.getAllCharts)

    let chart = allCharts.find(c => c.id == chartId) as Chart
    let chartTrigger = chart.source == "trigger" ? tables.find(t => t.derive?.trigger?.chart?.id == chartId)?.derive?.trigger : undefined

    let t = tables.find(t => t.id == chart.tableRef) as DictTable
    let activeTableThread = [...getTriggers(t, tables).map(tr => tr.tableId), chart.tableRef]
    
    const dispatch = useDispatch<AppDispatch>()

    const interleaveArrays: any = (a: any[], b: any[], spaceElement?: any) => a.length ? [a[0], spaceElement || '',...interleaveArrays(b, a.slice(1), spaceElement)] : b

    let previousInstructions : any = ""

    let buildTableCard = (tableId: string) => {
        let table = tables.find(t => t.id == tableId) as DictTable
        return <div
                key={`${tableId}-table-list-item`}
                className="table-list-item">
                <Button variant="text" sx={{textTransform: 'none', padding: 0, minWidth: 0}} onClick={() => { dispatch(dfActions.setFocusedTable(tableId)) }}>
                <Stack direction="row" sx={{fontSize: '12px'}} alignItems="center" gap={"2px"}>
                    {table.anchored ? <AnchorIcon fontSize="inherit" /> : <TableRowsIcon fontSize="inherit" />}
                    <Typography sx={{fontSize: '12px'}} >
                        {table.displayId || tableId}
                    </Typography>
                </Stack>
            </Button>
        </div>
    }

    let tableList = activeTableThread.map((tableId) => {
        return buildTableCard(tableId)
    })

    let leafTable = tables.find(t => t.id == activeTableThread[activeTableThread.length - 1]) as DictTable

    let triggers =  getTriggers(leafTable, tables)

    let instructionCards = triggers.map((trigger, i) => {
        let extractActiveFields = (t: Trigger) => {
            let encodingMap = allCharts.find(c => c.id == t.chart?.id)?.encodingMap
            if (!encodingMap) {
                return []
            }
            return Array.from(Object.values(encodingMap)).map((enc: EncodingItem) => enc.fieldID).filter(x => x != undefined)
        }

        let previousActiveFields = new Set(i == 0 ? [] : extractActiveFields(triggers[i - 1]))
        let currentActiveFields = new Set(extractActiveFields(trigger))
        let fieldsIdentical = _.isEqual(previousActiveFields, currentActiveFields)

        return  <Box 
            key={`${trigger.tableId}-trigger-card`}
            sx={{padding: 0, display: 'flex'}}>
            <Box sx={{minWidth: '1px', padding: '0px', width: '17px',  flex: 'none', display: 'flex', flexDirection: 'column'
                    }}>
                <Box sx={{padding:0, width: '1px', margin:'auto', height: '100%',
                            backgroundImage: 'linear-gradient(180deg, darkgray, darkgray 75%, transparent 75%, transparent 100%)',
                            backgroundSize: '1px 6px, 3px 100%'}}></Box>
            </Box>
            <TriggerCard className="encoding-shelf-trigger-card" trigger={trigger} hideFields={fieldsIdentical && trigger.instruction != ""} />
        </Box>
    })
    
    let spaceElement = "" //<Box sx={{padding: '4px 0px', background: 'aliceblue', margin: 'auto', width: '200px', height: '3px', paddingBottom: 0.5}}></Box>;

    previousInstructions = 
        <Collapse orientation="vertical" in={true} sx={{width: "100%" }}>
            <Box  sx={{padding: '4px 0px', display: 'flex', flexDirection: "column" }}>
                {interleaveArrays(tableList, instructionCards, spaceElement)}
            </Box>
        </Collapse>

    let postInstruction : any = ""
    if (chartTrigger) {
        
        let resultTable = tables.find(t => t.id == chartTrigger.resultTableId) as DictTable
        let leafUserCharts = allCharts.filter(c => c.tableRef == resultTable.id).filter(c => c.source == "user")

        let endChartCards = leafUserCharts.map((c) => {
            return <Card variant="outlined" className={"hover-card"} 
                            onClick={() => { 
                                dispatch(dfActions.setFocusedChart(c.id))
                                dispatch(dfActions.setFocusedTable(c.tableRef))
                            }}
                sx={{padding: '2px 0 2px 0', display: 'flex', alignItems: "left", width: 'fit-content', "& canvas": {'margin': 1}}}>
                <ChartElementFC chart={c} tableRows={resultTable.rows.slice(0, 100)} boxWidth={200} boxHeight={160}/>
            </Card>
        })

        postInstruction = <Collapse orientation="vertical" in={true} sx={{width: "100%"}}>
            <Box key="post-instruction" sx={{width: '17px', height: '12px'}}>
                <Box sx={{padding:0, width: '1px', margin:'auto', height: '100%',
                                        backgroundImage: 'linear-gradient(180deg, darkgray, darkgray 75%, transparent 75%, transparent 100%)',
                                        backgroundSize: '1px 6px, 3px 100%'}}></Box>
            </Box>
            {buildTableCard(resultTable.id)}
            <Box key="post-instruction" sx={{width: '17px', height: '12px'}}>
                <Box sx={{padding:0, width: '1px', margin:'auto', height: '100%',
                                        backgroundImage: 'linear-gradient(180deg, darkgray, darkgray 75%, transparent 75%, transparent 100%)',
                                        backgroundSize: '1px 6px, 3px 100%'}}></Box>
            </Box>
            <Box sx={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                {endChartCards}
            </Box>
            </Collapse>
    }

    const encodingShelf = (
        <Box className="encoding-shelf-compact" sx={{height: '100%'}}>
             {[   
                <Box
                    key="encoding-shelf" 
                    sx={{display: 'flex'}}> 
                    {previousInstructions}
                </Box>,
            ]}
            <Box sx={{width: '17px', height: '12px'}}>
                <Box sx={{padding:0, width: '1px', margin:'auto', height: '100%',
                                        backgroundImage: 'linear-gradient(180deg, darkgray, darkgray 75%, transparent 75%, transparent 100%)',
                                        backgroundSize: '1px 6px, 3px 100%'}}></Box>
            </Box>
            <EncodingShelfCard chartId={chartId}/>
            {postInstruction}
            <Box sx={{height: '12px'}}></Box>
        </Box>
    )

    return encodingShelf
}