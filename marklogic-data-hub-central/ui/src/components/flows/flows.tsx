import React, {useState, CSSProperties, useEffect, useContext, createRef} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCheckCircle} from "@fortawesome/free-solid-svg-icons";
import {faTrashAlt, faArrowAltCircleRight, faArrowAltCircleLeft} from "@fortawesome/free-regular-svg-icons";
import NewFlowDialog from "./new-flow-dialog/new-flow-dialog";
import axios from "axios";
import {useDropzone} from "react-dropzone";
import {Link, useLocation} from "react-router-dom";
import sourceFormatOptions from "@config/formats.config";
import {RunToolTips, SecurityTooltips} from "@config/tooltips.config";
import {AuthoritiesContext} from "@util/authorities";
import {getViewSettings, setViewSettings, UserContext} from "@util/user-context";
import styles from "./flows.module.scss";
import "./flows.scss";
import {ExclamationCircleFill, PlayCircleFill, X, ChevronDown, GearFill} from "react-bootstrap-icons";
import {Accordion, Card, Dropdown, Spinner, Modal, ButtonGroup} from "react-bootstrap";
import {HCButton, HCCard, HCTooltip, HCCheckbox} from "@components/common";
import {themeColors} from "@config/themes.config";


enum ReorderFlowOrderDirection {
  LEFT = "left",
  RIGHT = "right"
}

interface Props {
  flows: any;
  steps: any;
  deleteFlow: any;
  createFlow: any;
  updateFlow: any;
  deleteStep: any;
  runStep: any;
  runFlowSteps: any;
  canReadFlow: boolean;
  canWriteFlow: boolean;
  hasOperatorRole: boolean;
  running: any;
  uploadError: string;
  newStepToFlowOptions: any;
  addStepToFlow: any;
  flowsDefaultActiveKey: any;
  showStepRunResponse: any;
  runEnded: any;
  onReorderFlow: (flowIndex: number, newSteps: Array<any>) => void
  setJobId: any;
  setOpenJobResponse: any;
  isStepRunning?: boolean
}

const StepDefinitionTypeTitles = {
  "INGESTION": "Load",
  "ingestion": "Load",
  "MAPPING": "Map",
  "mapping": "Map",
  "MASTERING": "Master",
  "mastering": "Master",
  "MATCHING": "Match",
  "matching": "Match",
  "MERGING": "Merge",
  "merging": "Merge",
  "CUSTOM": "Custom",
  "custom": "Custom"
};

const Flows: React.FC<Props> = (props) => {
  const storage = getViewSettings();
  const openFlows = storage?.run?.openFlows;
  const hasDefaultKey = JSON.stringify(props.newStepToFlowOptions?.flowsDefaultKey) !== JSON.stringify(["-1"]);

  const {handleError} = useContext(UserContext);
  const [newFlow, setNewFlow] = useState(false);
  const [addedFlowName, setAddedFlowName] = useState("");
  const [title, setTitle] = useState("");
  const [flowData, setFlowData] = useState({});
  const [dialogVisible, setDialogVisible] = useState(false);
  const [stepDialogVisible, setStepDialogVisible] = useState(false);
  const [addStepDialogVisible, setAddStepDialogVisible] = useState(false);
  const [flowName, setFlowName] = useState("");
  const [stepName, setStepName] = useState("");
  const [stepType, setStepType] = useState("");
  const [stepNumber, setStepNumber] = useState("");
  const [runningStep, setRunningStep] = useState<any>({});
  const [runningFlow, setRunningFlow] = useState<any>("");
  const [fileList, setFileList] = useState<any[]>([]);
  const [showUploadError, setShowUploadError] = useState(false);
  const [openNewFlow, setOpenNewFlow] = useState(props.newStepToFlowOptions?.addingStepToFlow && !props.newStepToFlowOptions?.existingFlow);
  const [activeKeys, setActiveKeys] = useState(
    hasDefaultKey && (props.newStepToFlowOptions?.flowsDefaultKey ?? []).length > 0 ?
      props.newStepToFlowOptions?.flowsDefaultKey :
      (openFlows ? openFlows : [])
  );
  const [showLinks, setShowLinks] = useState("");
  const [startRun, setStartRun] = useState(false);
  const [latestJobData, setLatestJobData] = useState<any>({});
  const [createAdd, setCreateAdd] = useState(true);
  const [addFlowDirty, setAddFlowDirty] = useState({});
  const [addExternalFlowDirty, setExternalAddFlowDirty] = useState(true);
  const [hasQueriedInitialJobData, setHasQueriedInitialJobData] = useState(false);
  const [selectedStepOptions, setSelectedStepOptions] = useState<any>({}); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [currentFlowName, setCurrentFlowName] = useState(""); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [selectedStepDetails, setSelectedStepDetails] = useState<any>([{stepName: "", stepNumber: -1, stepDefinitionType: "", isChecked: false}]);
  const [runFlowClicked, setRunFlowClicked] = useState(false);
  const location = useLocation();

  // maintain a list of panel refs
  const flowPanels: any = props.flows.reduce((p, n) => ({...p, ...{[n.name]: createRef()}}), {});

  // Persists active keys in session storage as a user interacts with them
  useEffect(() => {
    if (activeKeys === undefined) {
      return;
    }
    const newStorage = {...storage, run: {...storage.run, openFlows: activeKeys}};
    setViewSettings(newStorage);
  }, [activeKeys]);

  // If a step was just added scroll the flow step panel fully to the right
  useEffect(() => {
    const scrollToEnd = f => {
      const panel = flowPanels[f];
      if (panel && panel.current) {
        const {scrollWidth} = panel.current;
        panel.current.scrollTo(scrollWidth * 2, 0);
      }
    };
    if (!props.flows.length) return;
    const currentFlow = props.flows.filter(({name}) => name === flowName).shift();
    if (currentFlow?.steps?.length > addFlowDirty[flowName]) {
      // Scrolling should happen on the last update after the number of steps in the flow has been updated
      scrollToEnd(flowName);
      setAddFlowDirty({...addFlowDirty, [flowName]: currentFlow?.steps?.length});
    } else {
      // if step is added from external view
      let state: any = location.state || {};
      const externalDirty = (state ? state["addFlowDirty"] : false) && addExternalFlowDirty;
      const thisFlow = state ? state["flowName"] : null;
      if (externalDirty) {
        scrollToEnd(thisFlow);
        setExternalAddFlowDirty(false);
      }
    }
  }, [props.flows]);

  useEffect(() => {
    if (openFlows === undefined || props.flows.length === 0 || hasQueriedInitialJobData) {
      return;
    }

    props.flows.map((flow, i) => {
      getFlowWithJobInfo(i);
    });

    setHasQueriedInitialJobData(true);
  }, [props.flows]);

  useEffect(() => {
    if (JSON.stringify(props.flowsDefaultActiveKey) !== JSON.stringify([]) && props.flowsDefaultActiveKey.length >= activeKeys.length) {
      setActiveKeys([...props.flowsDefaultActiveKey]);
    }

    if (props.flows) {
      // Get the latest job info when a step is added to an existing flow from Curate or Load Tile
      if (JSON.stringify(props.flows) !== JSON.stringify([])) {
        let stepsInFlow = props.flows[props.newStepToFlowOptions?.flowsDefaultKey]?.steps;
        if (props.newStepToFlowOptions && props.newStepToFlowOptions.addingStepToFlow && props.newStepToFlowOptions.existingFlow && props.newStepToFlowOptions.flowsDefaultKey && props.newStepToFlowOptions.flowsDefaultKey !== -1) {
          getFlowWithJobInfo(props.newStepToFlowOptions.flowsDefaultKey);
          if (startRun) {
            //run step after step is added to an existing flow
            if (props.newStepToFlowOptions.stepDefinitionType === "ingestion") {
              setShowUploadError(false);
              setRunningStep(stepsInFlow[stepsInFlow.length - 1]);
              setRunningFlow(props.newStepToFlowOptions?.flowName);
              openFilePicker();
              setStartRun(false);
            } else {
              props.runStep(props.newStepToFlowOptions?.flowName, stepsInFlow[stepsInFlow.length - 1]);
              setStartRun(false);
            }
          }
          //run step that is already inside a flow
        } else if (props.newStepToFlowOptions && !props.newStepToFlowOptions.addingStepToFlow && props.newStepToFlowOptions.startRunStep && props.newStepToFlowOptions.flowsDefaultKey && props.newStepToFlowOptions.flowsDefaultKey !== -1) {
          let runStepNum = stepsInFlow.findIndex(s => s.stepName === props.newStepToFlowOptions?.newStepName);
          if (startRun) {
            if (props.newStepToFlowOptions.stepDefinitionType === "ingestion") {
              setShowUploadError(false);
              setRunningStep(stepsInFlow[runStepNum]);
              setRunningFlow(props.newStepToFlowOptions?.flowName);
              openFilePicker();
              setStartRun(false);
            } else {
              props.runStep(props.newStepToFlowOptions?.flowName, stepsInFlow[runStepNum]);
              setStartRun(false);
            }
          }
        }
      }
    }
    if (activeKeys === undefined) {
      setActiveKeys([]);
    }
  }, [props.flows]);


  useEffect(() => {
    //run step after step is added to a new flow
    if (props.newStepToFlowOptions && !props.newStepToFlowOptions.existingFlow && startRun && addedFlowName) {
      let indexFlow = props.flows?.findIndex(i => i.name === addedFlowName);
      if (props.flows[indexFlow]?.steps.length > 0) {
        let indexStep = props.flows[indexFlow].steps.findIndex(s => s.stepName === props.newStepToFlowOptions.newStepName);
        if (props.flows[indexFlow].steps[indexStep].stepDefinitionType === "ingestion") {
          setShowUploadError(false);
          setRunningStep(props.flows[indexFlow].steps[indexStep]);
          setRunningFlow(addedFlowName);
          openFilePicker();
        } else {
          props.runStep(addedFlowName, props.flows[indexFlow].steps[indexStep]);
          setAddedFlowName("");
          setStartRun(false);
        }
      }
    }
  }, [props.steps]);


  // Get the latest job info after a step (in a flow) run
  useEffect(() => {
    let num = props.flows.findIndex((flow) => flow.name === props.runEnded.flowId);
    if (num >= 0) {
      getFlowWithJobInfo(num);
    }
  }, [props.runEnded]);

  useEffect(() => {
    if (props.newStepToFlowOptions && props.newStepToFlowOptions.startRunStep) {
      setStartRun(true);
    }
  }, [props.newStepToFlowOptions]);

  // For role-based privileges
  const authorityService = useContext(AuthoritiesContext);
  const authorityByStepType = {
    ingestion: authorityService.canReadLoad(),
    mapping: authorityService.canReadMapping(),
    matching: authorityService.canReadMatchMerge(),
    merging: authorityService.canReadMatchMerge(),
    custom: authorityService.canReadCustom()
  };

  const OpenAddNewDialog = () => {
    setCreateAdd(false);
    setTitle("New Flow");
    setNewFlow(true);
  };

  //Custom CSS for source Format
  const sourceFormatStyle = (sourceFmt) => {
    let customStyles: CSSProperties;
    if (!sourceFmt) {
      customStyles = {
        float: "left",
        backgroundColor: "#fff",
        color: "#fff",
        padding: "5px"
      };
    } else {
      customStyles = {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        height: "35px",
        width: "35px",
        lineHeight: "35px",
        backgroundColor: sourceFormatOptions[sourceFmt].color,
        fontSize: sourceFmt === "json" ? "12px" : "13px",
        borderRadius: "50%",
        textAlign: "center",
        color: "#ffffff",
        verticalAlign: "middle"
      };
    }
    return customStyles;
  };

  const handleStepAdd = async (stepName, flowName, stepType) => {
    setAddStepDialogVisible(true);
    setFlowName(flowName);
    setStepName(stepName);
    setStepType(stepType);
  };

  const handleFlowDelete = (name) => {
    setDialogVisible(true);
    setFlowName(name);
  };

  const handleStepDelete = (flowName, stepDetails) => {
    setStepDialogVisible(true);
    setFlowName(flowName);
    setStepName(stepDetails.stepName);
    setStepType(stepDetails.stepDefinitionType);
    setStepNumber(stepDetails.stepNumber);
  };

  const onOk = (name) => {
    props.deleteFlow(name);
    setDialogVisible(false);
  };

  const onStepOk = (flowName, stepNumber) => {
    props.deleteStep(flowName, stepNumber);
    setStepDialogVisible(false);
  };

  const onAddStepOk = async (stepName, flowName, stepType) => {
    await props.addStepToFlow(stepName, flowName, stepType);
    // Open flow panel if not open
    const flowIndex = props.flows.findIndex(f => f.name === flowName);
    if (!activeKeys.includes(flowIndex)) {
      let newActiveKeys = [...activeKeys, flowIndex];
      setActiveKeys(newActiveKeys);
    }
    await setAddStepDialogVisible(false);
    await setAddFlowDirty({...addFlowDirty, [flowName]: props.flows[flowIndex].steps.length});
  };

  const onCancel = () => {
    setDialogVisible(false);
    setStepDialogVisible(false);
    setAddStepDialogVisible(false);
  };

  const isStepInFlow = (stepName, flowName) => {
    let result = false;
    let flow;
    if (props.flows) flow = props.flows.find(f => f.name === flowName);
    if (flow) result = flow["steps"].findIndex(s => s.stepName === stepName) > -1;
    return result;
  };

  // Setup for file upload
  const {getRootProps, getInputProps, open, acceptedFiles} = useDropzone({
    noClick: true,
    noKeyboard: true
  });

  const openFilePicker = () => {
    open();
    setStartRun(false);
  };

  useEffect(() => {
    acceptedFiles.forEach(file => {
      setFileList(prevState => [...prevState, file]);
    });
    if (startRun) {
      setAddedFlowName("");
      setStartRun(false);
    }
  }, [acceptedFiles]);

  useEffect(() => {
    customRequest();
  }, [fileList]);

  const deleteConfirmation = (
    <Modal
      show={dialogVisible}
    >
      <Modal.Header className={"bb-none"}>
        <button type="button" className="btn-close" aria-label="Close" onClick={onCancel}></button>
      </Modal.Header>
      <Modal.Body className={"text-center pt-0 pb-4"}>
        <div className={`mb-4 ${styles.confirmationText}`}>Are you sure you want to delete the <strong>{flowName}</strong> flow?</div>
        <div>
          <HCButton variant="outline-light" aria-label={"No"} className={"me-2"} onClick={onCancel}>
            No
          </HCButton>
          <HCButton aria-label={"Yes"} variant="primary" type="submit" onClick={() => onOk(flowName)}>
            Yes
          </HCButton>
        </div>
      </Modal.Body>
    </Modal>
  );

  const deleteStepConfirmation = (
    <Modal
      show={stepDialogVisible}
    >
      <Modal.Header className={"bb-none"}>
        <button type="button" className="btn-close" aria-label="Close" onClick={onCancel}></button>
      </Modal.Header>
      <Modal.Body className={"text-center pt-0 pb-4"}>
        <div className={`mb-4 ${styles.confirmationText}`}>Are you sure you want to remove the <strong>{stepName}</strong> step from the <strong>{flowName}</strong> flow?</div>
        <div>
          <HCButton variant="outline-light" aria-label={"No"} className={"me-2"} onClick={onCancel}>
            No
          </HCButton>
          <HCButton aria-label={"Yes"} variant="primary" type="submit" onClick={() => onStepOk(flowName, stepNumber)}>
            Yes
          </HCButton>
        </div>
      </Modal.Body>
    </Modal>
  );

  const addStepConfirmation = (
    <Modal
      show={addStepDialogVisible}
    >
      <Modal.Header className={"bb-none"}>
        <button type="button" className="btn-close" aria-label="Close" onClick={onCancel}></button>
      </Modal.Header>
      <Modal.Body className={"text-center pt-0 pb-4"}>
        <div className={`mb-4 ${styles.confirmationText}`}>
          {
            isStepInFlow(stepName, flowName)
              ?
              <p>The step <b>{stepName}</b> is already in the flow <b>{flowName}</b>. Would you like to add another instance?</p>
              :
              <p>Are you sure you want to add step <b>{stepName}</b> to flow <b>{flowName}</b>?</p>
          }
        </div>
        <div>
          <HCButton variant="outline-light" aria-label={"No"} className={"me-2"} onClick={onCancel}>
            No
          </HCButton>
          <HCButton aria-label={"Yes"} variant="primary" type="submit" onClick={() => onAddStepOk(stepName, flowName, stepType)}>
            Yes
          </HCButton>
        </div>
      </Modal.Body>
    </Modal>
  );

  /* Commenting out for DHFPROD-7820, remove unfinished run flow epic stories from 5.6 */

  const onCheckboxChange = (event, checkedValues, stepNumber, stepDefinitionType, flowNames, stepId, sourceFormat) => {
    if (currentFlowName !== flowNames) {
      if (currentFlowName.length > 0) {
        let propertyNames = Object.getOwnPropertyNames(selectedStepOptions);
        for (let i = 0; i < propertyNames.length; i++) {
          delete selectedStepOptions[propertyNames[i]];
        }
        for (let i = 0; i < selectedStepDetails.length; i++) {
          selectedStepDetails.shift();
        }
        setSelectedStepDetails({stepName: "", stepNumber: -1, stepDefinitionType: "", isChecked: false});
      }
      setCurrentFlowName(flowNames);
    }
    let data = {stepName: "", stepNumber: -1, stepDefinitionType: "", isChecked: false, flowName: "", stepId: "", sourceFormat: ""};
    data.stepName = checkedValues;
    data.stepNumber = stepNumber;
    data.stepDefinitionType = stepDefinitionType;
    data.isChecked = event.target.checked;
    data.flowName = flowNames;
    data.stepId = stepId;
    data.sourceFormat = sourceFormat;

    let obj = selectedStepDetails;
    if (data.isChecked) {
      obj.push(data);
    } else {
      for (let i = 0; i < obj.length; i++) {
        if (obj[i].stepName === checkedValues) {
          obj.splice(i, 1);
        }
      }
    }
    setSelectedStepDetails(obj);
    setSelectedStepOptions({...selectedStepOptions, [checkedValues]: event.target.checked});
    event.stopPropagation();
  };

  const flowMenu = (flowName) => {
    return (
      <>
        <Dropdown.Header className="py-0 fs-6 p-0 mb-2">Select the steps to include in the run:</Dropdown.Header>
        {props.flows.map((flow) => (
          flow["name"] === flowName &&
            flow.steps.map((step, index)  => (
              <div id={index} className={styles.divItem}>
                <HCCheckbox
                  id={step.stepName}
                  value={selectedStepOptions[step.stepName]}
                  handleClick={() => (event) => onCheckboxChange(event, step.stepName, step.stepNumber, step.stepDefinitionType, flowName, step.stepId, step.sourceFormat)}
                  checked={selectedStepOptions[step.stepName]}
                >{step.stepName}
                </HCCheckbox>
              </div>
            ))))}
      </>
    );
  };

  const handleRunFlow = async (index, name) => {
    setRunFlowClicked(true);
    const setKey = async () => {
      await setActiveKeys(`${index}`);
    };
    setRunningFlow(name);
    selectedStepDetails.shift();
    let flag=false;

    await selectedStepDetails.map(async step => {
      if (step.stepDefinitionType === "ingestion") {
        flag=true;
        setRunningStep(step);
        await setKey();
        await openFilePicker();
      }
    });
    if (Object.keys(selectedStepOptions).length === 0 && selectedStepOptions.constructor === Object) {
      flag=true;
      await setKey();
      await openFilePicker();
    }
    if (!flag) {
      let stepNumbers=[{}];
      for (let i=0;i<selectedStepDetails.length;i++) {
        stepNumbers.push(selectedStepDetails[i]);
      }
      stepNumbers.shift();
      await props.runFlowSteps(name, stepNumbers)
        .then(() => {
          setSelectedStepOptions({});
          setSelectedStepDetails([{stepName: "", stepNumber: -1, stepDefinitionType: "", isChecked: false}]);
        });
    }
  };

  const stepMenu = (flowName, i) => (

    <Dropdown align="end" >
      <Dropdown.Toggle data-testid={`addStep-${flowName}`} aria-label={`addStep-${flowName}`} disabled={!props.canWriteFlow} variant="outline-light" className={props.canWriteFlow ? styles.stepMenu : styles.stepMenuDisabled}>
        {
          props.canWriteFlow ?
            <>Add Step<ChevronDown className="ms-2" /> </>
            :
            <HCTooltip text={SecurityTooltips.missingPermission} id="add-step-disabled-tooltip" placement="bottom">
              <span aria-label={"addStepDisabled-" + i}>Add Step<ChevronDown className="ms-2" /> </span>
            </HCTooltip>
        }
      </Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.Header className="py-0 px-2 fs-6">Load</Dropdown.Header>
        {props.steps && props.steps["ingestionSteps"] && props.steps["ingestionSteps"].length > 0 ? props.steps["ingestionSteps"].map((elem, index) => (
          <Dropdown.Item key={index} aria-label={`${elem.name}-to-flow`}>
            <div
              onClick={() => { handleStepAdd(elem.name, flowName, "ingestion"); }}
            >{elem.name}</div>
          </Dropdown.Item>
        )) : null}

        <Dropdown.Header className="py-0 px-2 fs-6">Map</Dropdown.Header>
        {props.steps && props.steps["mappingSteps"] && props.steps["mappingSteps"].length > 0 ? props.steps["mappingSteps"].map((elem, index) => (
          <Dropdown.Item key={index} aria-label={`${elem.name}-to-flow`}>
            <div
              onClick={() => { handleStepAdd(elem.name, flowName, "mapping"); }}
            >{elem.name}</div>
          </Dropdown.Item>
        )) : null}

        <Dropdown.Header className="py-0 px-2 fs-6">Match</Dropdown.Header>
        {props.steps && props.steps["matchingSteps"] && props.steps["matchingSteps"].length > 0 ? props.steps["matchingSteps"].map((elem, index) => (
          <Dropdown.Item key={index} aria-label={`${elem.name}-to-flow`}>
            <div
              onClick={() => { handleStepAdd(elem.name, flowName, "matching"); }}
            >{elem.name}</div>
          </Dropdown.Item>
        )) : null}

        <Dropdown.Header className="py-0 px-2 fs-6">Merge</Dropdown.Header>
        {props.steps && props.steps["mergingSteps"] && props.steps["mergingSteps"].length > 0 ? props.steps["mergingSteps"].map((elem, index) => (
          <Dropdown.Item key={index} aria-label={`${elem.name}-to-flow`}>
            <div
              onClick={() => { handleStepAdd(elem.name, flowName, "merging"); }}
            >{elem.name}</div>
          </Dropdown.Item>
        )) : null}

        <Dropdown.Header className="py-0 px-2 fs-6">Master</Dropdown.Header>
        {props.steps && props.steps["masteringSteps"] && props.steps["masteringSteps"].length > 0 ? props.steps["masteringSteps"].map((elem, index) => (
          <Dropdown.Item key={index} aria-label={`${elem.name}-to-flow`}>
            <div
              onClick={() => { handleStepAdd(elem.name, flowName, "mastering"); }}
            >{elem.name}</div>
          </Dropdown.Item>
        )) : null}

        <Dropdown.Header className="py-0 px-2 fs-6">Custom</Dropdown.Header>
        {props.steps && props.steps["customSteps"] && props.steps["customSteps"].length > 0 ? props.steps["customSteps"].map((elem, index) => (
          <Dropdown.Item key={index} aria-label={`${elem.name}-to-flow`}>
            <div
              onClick={() => { handleStepAdd(elem.name, flowName, "custom"); }}
            >{elem.name}</div>
          </Dropdown.Item>
        )) : null}
      </Dropdown.Menu>
    </Dropdown>
  );

  const panelActions = (name, i) => (
    <div
      className={styles.panelActionsContainer}
      id="panelActions"
      onClick={event => {
        event.stopPropagation(); // Do not trigger collapse
        event.preventDefault();
      }}
    >
      <span id="stepsDropdown" className={styles.hoverColor}>
        <Dropdown as={ButtonGroup}>
          <HCButton
            variant="transparent"
            className={styles.runFlow}
            //className={"btn-outline-secondary"}
            key={`stepsDropdownButton-${name}`}
            data-testid={`runFlow-${name}`}
            id={`runFlow-${name}`}
            size="sm"
            onClick={() => handleRunFlow(i, name)}
          ><><PlayCircleFill className={styles.runIcon}/> Run Flow</></HCButton>
          <Dropdown.Toggle split variant="transparent" className={styles.runIconToggle}>
            <GearFill className={styles.runIcon} role="step-settings button" aria-label={`stepSettings-${name}`} /></Dropdown.Toggle>
          <Dropdown.Menu className={styles.dropdownMenu}>
            {flowMenu(name)}
          </Dropdown.Menu>
        </Dropdown>
      </span>

      {stepMenu(name, i)}
      <span className={styles.deleteFlow}>
        {props.canWriteFlow ?
          <HCTooltip text="Delete Flow" id="disabled-trash-tooltip" placement="bottom">
            <i aria-label={`deleteFlow-${name}`} className={"d-flex align-items-center"}>
              <FontAwesomeIcon
                icon={faTrashAlt}
                onClick={() => { handleFlowDelete(name); }}
                data-testid={`deleteFlow-${name}`}
                className={styles.deleteIcon}
                size="lg" />
            </i>
          </HCTooltip>
          :
          <HCTooltip text={"Delete Flow: " + SecurityTooltips.missingPermission} id="trash-tooltip" placement="bottom">
            <i aria-label={`deleteFlowDisabled-${name}`} className={"d-flex align-items-center"}>
              <FontAwesomeIcon
                icon={faTrashAlt}
                data-testid={`deleteFlow-${name}`}
                className={styles.disabledDeleteIcon}
                size="lg" />
            </i>
          </HCTooltip>}
      </span>
    </div>
  );

  const flowHeader = (name, index) => (
    <span id={"flow-header-" + name} className={styles.flowHeader}>
      <HCTooltip text={props.canWriteFlow ? "Edit Flow" : "Flow Details"} id="open-edit-tooltip" placement="bottom">
        <span className={styles.flowName} onClick={(e) => OpenEditFlowDialog(e, index)}>
          {name}
        </span>
      </HCTooltip>
      {latestJobData && latestJobData[name] && latestJobData[name].find(step => step.jobId) ?
        <HCTooltip text={"Flow Status"} placement="bottom" id="">
          <span onClick={(e) => OpenFlowJobStatus(e, index, name)} className={styles.infoIcon} data-testid={`${name}-flow-status`}>
            <ExclamationCircleFill data-icon="exclamation-circle" aria-label="icon: exclamation-circle" className={styles.unSuccessfulRun} />
          </span>
        </HCTooltip>
        : ""
      }
    </span>

  );
  const OpenFlowJobStatus = (e, index, name) => {
    e.stopPropagation();
    e.preventDefault();
    let jobIdIndex = latestJobData[name].findIndex(step => step.hasOwnProperty("jobId"));
    props.setJobId(latestJobData[name][jobIdIndex].jobId);
    props.setOpenJobResponse(true);
  };

  const OpenEditFlowDialog = (e, index) => {
    e.stopPropagation();
    setTitle("Edit Flow");
    setFlowData(prevState => ({...prevState, ...props.flows[index]}));
    setNewFlow(true);
  };

  const StepDefToTitle = (stepDef) => {
    return (StepDefinitionTypeTitles[stepDef]) ? StepDefinitionTypeTitles[stepDef] : "Unknown";
  };

  const customRequest = async () => {
    const filenames = fileList.map(({name}) => name);
    if (filenames.length) {
      let fl = fileList;
      const formData = new FormData();

      fl.forEach(file => {
        formData.append("files", file);
      });

      if (!runFlowClicked) {
        await props.runStep(runningFlow, runningStep, formData)
          .then(resp => {
            setShowUploadError(true);
            setFileList([]);
          });
      } else {
        let stepNumbers = [{}];
        for (let i = 0; i < selectedStepDetails.length; i++) {
          stepNumbers.push(selectedStepDetails[i]);
        }
        stepNumbers.shift();
        await props.runFlowSteps(runningFlow, stepNumbers, formData)
          .then(resp => {
            setShowUploadError(true);
            setFileList([]);
            setSelectedStepOptions({});
            setSelectedStepDetails([{stepName: "", stepNumber: -1, stepDefinitionType: "", isChecked: false}]);
            setRunFlowClicked(false);
          });
      }
    }
  };

  const isRunning = (flowId, stepId) => {
    let result = props.running.find(r => (r.flowId === flowId && r.stepId === stepId));
    return result !== undefined;
  };

  function handleMouseOver(e, name) {
    setShowLinks(name);
  }

  const showStepRunResponse = async (step) => {
    try {
      let response = await axios.get("/api/jobs/" + step.jobId);
      if (response.status === 200) {
        props.showStepRunResponse(step.jobId);
      }
    } catch (error) {
      handleError(error);
    }
  };

  const lastRunResponse = (step) => {
    let stepEndTime, tooltipText;
    if (step.stepEndTime) {
      stepEndTime = new Date(step.stepEndTime).toLocaleString();
    }
    if (!step.lastRunStatus) {
      return;
    } else if (step.lastRunStatus === "completed step " + step.stepNumber) {
      tooltipText = "Step last ran successfully on " + stepEndTime;
      return (
        <HCTooltip text={tooltipText} id="success-tooltip" placement="bottom">
          <span onClick={(e) => showStepRunResponse(step.jobId)}>
            <i><FontAwesomeIcon aria-label="icon: check-circle" icon={faCheckCircle} className={styles.successfulRun} size="lg" data-testid={`check-circle-${step.stepName}`} /></i>
          </span>
        </HCTooltip>
      );

    } else if (step.lastRunStatus === "completed with errors step " + step.stepNumber) {
      tooltipText = "Step last ran with errors on " + stepEndTime;
      return (
        <span onClick={(e) => showStepRunResponse(step.jobId)}>
          <HCTooltip text={tooltipText} id="complete-with-errors-tooltip" placement="bottom">
            <ExclamationCircleFill aria-label="icon: exclamation-circle" className={styles.unSuccessfulRun} />
          </HCTooltip>
        </span>
      );
    } else {
      tooltipText = "Step last failed on " + stepEndTime;
      return (
        <span onClick={(e) => showStepRunResponse(step.jobId)}>
          <HCTooltip text={tooltipText} id="step-last-failed-tooltip" placement="bottom">
            <ExclamationCircleFill data-icon="exclamation-circle" aria-label="icon: exclamation-circle" className={styles.unSuccessfulRun} />
          </HCTooltip>
        </span>
      );
    }
  };

  const updateFlow = async (flowName, flowDesc, steps) => {
    let updatedFlow;
    try {
      updatedFlow = {
        name: flowName,
        steps: steps,
        description: flowDesc
      };
      await axios.put(`/api/flows/` + flowName, updatedFlow);

    } catch (error) {
      console.error("Error updating flow", error);
    }
  };

  const reorderFlow = (id, flowName, direction: ReorderFlowOrderDirection) => {
    let flowNum = props.flows.findIndex((flow) => flow.name === flowName);
    let flowDesc = props.flows[flowNum]["description"];
    const stepList = props.flows[flowNum]["steps"];
    let newSteps = stepList;

    if (direction === ReorderFlowOrderDirection.RIGHT) {
      if (id <= stepList.length - 2) {
        newSteps = [...stepList];
        const oldLeftStep = newSteps[id];
        const oldRightStep = newSteps[id + 1];
        newSteps[id] = oldRightStep;
        newSteps[id + 1] = oldLeftStep;
      }
    } else {
      if (id >= 1) {
        newSteps = [...stepList];
        const oldLeftStep = newSteps[id - 1];
        const oldRightStep = newSteps[id];
        newSteps[id - 1] = oldRightStep;
        newSteps[id] = oldLeftStep;
      }
    }

    let steps: string[] = [];
    for (let i = 0; i < newSteps.length; i++) {
      newSteps[i].stepNumber = String(i + 1);
      steps.push(newSteps[i].stepId);
    }

    const reorderedList = [...newSteps];
    props.onReorderFlow(flowNum, reorderedList);
    updateFlow(flowName, flowDesc, steps);
  };


  const getFlowWithJobInfo = async (flowNum) => {
    let currentFlow = props.flows[flowNum];

    if (currentFlow === undefined) {
      return;
    }

    if (currentFlow["steps"].length > 0) {
      try {
        let response = await axios.get("/api/flows/" + currentFlow.name + "/latestJobInfo");
        if (response.status === 200 && response.data) {
          let currentFlowJobInfo = {};
          currentFlowJobInfo[currentFlow["name"]] = response.data["steps"];
          setLatestJobData(prevJobData => (
            {...prevJobData, ...currentFlowJobInfo}
          ));
        }
      } catch (error) {
        console.error("Error getting latest job info ", error);
      }
    }
  };

  let panels;

  if (props.flows) {
    panels = props.flows.map((flow, i) => {
      let flowName = flow.name;
      let cards = flow.steps.map((step, index) => {
        let sourceFormat = step.sourceFormat;
        let stepNumber = step.stepNumber;
        let viewStepId = `${flowName}-${stepNumber}`;
        let stepDefinitionType = step.stepDefinitionType ? step.stepDefinitionType.toLowerCase() : "";
        let stepDefinitionTypeTitle = StepDefinitionTypeTitles[stepDefinitionType];
        return (
          <div key={viewStepId} id="flowSettings">
            <HCCard
              className={styles.cardStyle}
              title={StepDefToTitle(step.stepDefinitionType)}
              actions={[
                <div className={styles.reorder}>
                  {index !== 0 && props.canWriteFlow &&
                    <div className={styles.reorderLeft}>
                      <HCTooltip text="Move left" id="move-left-tooltip" placement="bottom">
                        <i>
                          <FontAwesomeIcon
                            aria-label={`leftArrow-${step.stepName}`}
                            icon={faArrowAltCircleLeft}
                            className={styles.reorderFlowLeft}
                            role="button"
                            onClick={() => reorderFlow(index, flowName, ReorderFlowOrderDirection.LEFT)}
                            onKeyDown={(e) => reorderFlowKeyDownHandler(e, index, flowName, ReorderFlowOrderDirection.LEFT)}
                            tabIndex={0} />
                        </i>
                      </HCTooltip>
                    </div>
                  }
                  <div className={styles.reorderRight}>
                    <div className={styles.stepResponse} data-testid={`${step.stepName}-last-run`}>
                      {latestJobData && latestJobData[flowName] && latestJobData[flowName][index]
                        ? lastRunResponse(latestJobData[flowName][index])
                        : ""
                      }
                    </div>
                    {index < flow.steps.length - 1 && props.canWriteFlow &&
                      <HCTooltip aria-label="icon: right" text="Move right" id="move-right-tooltip" placement="bottom" >
                        <i>
                          <FontAwesomeIcon
                            aria-label={`rightArrow-${step.stepName}`}
                            icon={faArrowAltCircleRight}
                            className={styles.reorderFlowRight}
                            role="button"
                            onClick={() => reorderFlow(index, flowName, ReorderFlowOrderDirection.RIGHT)}
                            onKeyDown={(e) => reorderFlowKeyDownHandler(e, index, flowName, ReorderFlowOrderDirection.RIGHT)}
                            tabIndex={0} />
                        </i>
                      </HCTooltip>
                    }
                  </div>
                </div>
              ]}
              titleExtra={
                <div className={styles.actions}>
                  {props.hasOperatorRole ?
                    step.stepDefinitionType.toLowerCase() === "ingestion" ?
                      <div {...getRootProps()} style={{display: "inline-block"}}>
                        <input {...getInputProps()} id="fileUpload" />
                        <div
                          className={styles.run}
                          aria-label={`runStep-${step.stepName}`}
                          data-testid={"runStep-" + stepNumber}
                          onClick={() => {
                            setShowUploadError(false);
                            setRunningStep(step);
                            setRunningFlow(flowName);
                            openFilePicker();
                          }}
                        >
                          <HCTooltip text={RunToolTips.ingestionStep} id="run-ingestion-tooltip" placement="bottom">
                            <PlayCircleFill aria-label="icon: play-circle" color={themeColors.defaults.questionCircle} size={20} />
                          </HCTooltip>
                        </div>
                      </div>
                      :
                      <div
                        className={styles.run}
                        onClick={() => {
                          setShowUploadError(false);
                          props.runStep(flowName, step);
                        }}
                        aria-label={`runStep-${step.stepName}`}
                        data-testid={"runStep-" + stepNumber}
                      >
                        <HCTooltip text={RunToolTips.otherSteps} id="run-tooltip" placement="bottom">
                          <PlayCircleFill aria-label="icon: play-circle" color={themeColors.defaults.questionCircle} size={20} />
                        </HCTooltip>
                      </div>
                    :
                    <div
                      className={styles.disabledRun}
                      onClick={(event) => { event.stopPropagation(); event.preventDefault(); }}
                      aria-label={"runStepDisabled-" + step.stepName}
                      data-testid={"runStepDisabled-" + stepNumber}
                    >
                      <PlayCircleFill size={20} />
                    </div>
                  }
                  {props.canWriteFlow ?
                    <HCTooltip text={RunToolTips.removeStep} id="delete-step-tooltip" placement="bottom">
                      <div className={styles.delete} aria-label={`deleteStep-${step.stepName}`} onClick={() => handleStepDelete(flowName, step)}>
                        <X aria-label="icon: close" color={themeColors.defaults.questionCircle} size={27} />
                      </div>
                    </HCTooltip> :
                    <HCTooltip text={RunToolTips.removeStep} id="delete-step-tooltip" placement="bottom">
                      <div className={styles.disabledDelete} aria-label={`deleteStepDisabled-${step.stepName}`} onClick={(event) => { event.stopPropagation(); event.preventDefault(); }}>
                        <X aria-label="icon: close" color={themeColors.defaults.questionCircle} size={27} />
                      </div>
                    </HCTooltip>
                  }
                </div>
              }
              footerClassName={styles.cardFooter}
            >
              <div aria-label={viewStepId + "-content"} className={styles.cardContent}
                onMouseOver={(e) => handleMouseOver(e, viewStepId)}
                onMouseLeave={(e) => setShowLinks("")} >
                {sourceFormat ?
                  <div className={styles.format} style={sourceFormatStyle(sourceFormat)} >{sourceFormatOptions[sourceFormat].label}</div>
                  : null}
                <div className={sourceFormat ? styles.loadStepName : styles.name}>{step.stepName}</div>
                <div className={styles.cardLinks}
                  style={{display: showLinks === viewStepId && step.stepId && authorityByStepType[stepDefinitionType] ? "block" : "none"}}
                  aria-label={viewStepId + "-cardlink"}
                >
                  <Link id={"tiles-step-view-" + viewStepId}
                    to={{
                      pathname: `/tiles/${stepDefinitionType === "ingestion" ? "load" : "curate"}`,
                      state: {
                        stepToView: step.stepId,
                        stepDefinitionType: stepDefinitionType,
                        targetEntityType: step.targetEntityType
                      }
                    }}
                  >
                    <div className={styles.cardLink} data-testid={`${viewStepId}-viewStep`}>View {stepDefinitionTypeTitle} steps</div>
                  </Link>
                </div>
              </div>
              <div className={styles.uploadError}>
                {showUploadError && flowName === runningFlow && stepNumber === runningStep.stepNumber ? props.uploadError : ""}
              </div>
              <div className={styles.running} style={{display: isRunning(flowName, stepNumber) ? "block" : "none"}}>
                <div><Spinner animation="border" data-testid="spinner" variant="primary" /></div>
                <div className={styles.runningLabel}>Running...</div>
              </div>
            </HCCard>
          </div>
        );
      });
      return (
        <Accordion className={"w-100"} flush key={i} id={flowName} activeKey={activeKeys.includes(i) ? i : ""} defaultActiveKey={activeKeys.includes(i) ? i : ""}>
          <Accordion.Item eventKey={i}>
            <Card>
              <Card.Header className={"p-0 pe-3 d-flex bg-white"}>
                <Accordion.Button onClick={() => handlePanelInteraction(i)}>{flowHeader(flowName, i)}</Accordion.Button>
                {panelActions(flowName, i)}
              </Card.Header>
              <Accordion.Body className={styles.panelContent} ref={flowPanels[flowName]}>
                {cards}
              </Accordion.Body>
            </Card>
          </Accordion.Item>
        </Accordion>
      );
    });
  }

  //Update activeKeys on Collapse Panel interactions
  const handlePanelInteraction = (key) => {
    const tmpActiveKeys = [...activeKeys];
    const index = tmpActiveKeys.indexOf(key);
    index !== -1 ? tmpActiveKeys.splice(index, 1) : tmpActiveKeys.push(key);
    /* Request to get latest job info for the flow will be made when someone opens the pane for the first time
        or opens a new pane. Closing the pane shouldn't send any requests*/
    if (!activeKeys || (tmpActiveKeys.length > activeKeys.length && tmpActiveKeys.length > 0)) {
      getFlowWithJobInfo(tmpActiveKeys[tmpActiveKeys.length - 1]);
    }
    setActiveKeys([...tmpActiveKeys]);
  };

  const createFlowKeyDownHandler = (event) => {
    if (event.key === "Enter") {
      OpenAddNewDialog();
      event.preventDefault();
    }
  };

  const reorderFlowKeyDownHandler = (event, index, flowName, direction) => {
    if (event.key === "Enter") {
      reorderFlow(index, flowName, direction);
      event.preventDefault();
    }
  };


  return (
    <div id="flows-container" className={styles.flowsContainer}>
      {props.canReadFlow || props.canWriteFlow ?
        <>
          <div className={styles.createContainer}>
            {
              props.canWriteFlow ?
                <span>
                  {/* //Bootstrap Button
                  <Button
                    variant="primary"
                    onClick={OpenAddNewDialog}
                    onKeyDown={createFlowKeyDownHandler}
                    aria-label={"create-flow"}
                    tabIndex={0}
                  >Create Flow</Button> */}
                  <HCButton
                    className={styles.createButton}
                    variant="primary" onClick={OpenAddNewDialog} onKeyDown={createFlowKeyDownHandler}
                    aria-label={"create-flow"}
                    tabIndex={0}
                  >Create Flow</HCButton>
                </span>
                :
                <HCTooltip id="missing-permission-tooltip" placement="top" text={SecurityTooltips.missingPermission} className={styles.tooltipOverlay}>
                  <span className={styles.disabledCursor}>
                    <HCButton
                      className={styles.createButtonDisabled}
                      variant="primary"
                      disabled={true}
                      aria-label={"create-flow-disabled"}
                      tabIndex={-1}
                    >Create Flow</HCButton>
                  </span>
                </HCTooltip>
            }
          </div>
          {panels}
          <NewFlowDialog
            newFlow={newFlow || openNewFlow}
            title={title}
            setNewFlow={setNewFlow}
            setAddedFlowName={setAddedFlowName}
            createFlow={props.createFlow}
            createAdd={createAdd}
            updateFlow={props.updateFlow}
            flowData={flowData}
            canWriteFlow={props.canWriteFlow}
            addStepToFlow={props.addStepToFlow}
            newStepToFlowOptions={props.newStepToFlowOptions}
            setOpenNewFlow={setOpenNewFlow}
          />
          {deleteConfirmation}
          {deleteStepConfirmation}
          {addStepConfirmation}
        </> :
        <div></div>
      }
    </div>
  );
};

export default Flows;
