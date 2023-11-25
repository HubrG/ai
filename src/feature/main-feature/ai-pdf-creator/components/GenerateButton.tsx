import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { faStop } from "@fortawesome/pro-duotone-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState } from "react";
import { Tooltip } from "react-tooltip";

interface Props {
  generatePlan: () => void;
  regeneratePlan: () => void;
  handleCancel: () => void;
  handleTryAgain: () => void;
  generatePlanDone: boolean;
  generatePlanButton: boolean;
  responseSubject: string;
  chapterContent: number;
  createdPlans: number;
  regenerate: boolean;
  whatInProgress: string;
}
export const GenerateButton = ({
  whatInProgress,
  createdPlans,
  chapterContent,
  generatePlanButton,
  regenerate,
  handleCancel,
  generatePlanDone,
  responseSubject,
  regeneratePlan,
  generatePlan,
  handleTryAgain,
}: Props) => {
  // const [generatePlanButton, setGeneratePlanButton] = useState(false);
  return (
    <>
      {whatInProgress === "plan" || whatInProgress === "content" ? (
        <Button className="w-full flex flex-row justify-evenly" disabled={true}>
          <Loader />
          <span>
            {whatInProgress === "plan" ? "Plan generating..." : ""}
            {whatInProgress === "content" ? "Content generating" : ""}
          </span>
        </Button>
      ) : (
        <>
          {chapterContent == 0 &&
            (createdPlans == 0 || whatInProgress) &&
            !generatePlanButton && (
              <Button
                className="w-full flex flex-row justify-evenly"
                onClick={!regenerate ? generatePlan : regeneratePlan}>
                <span>
                  {whatInProgress === ""
                    ? "Initialization"
                    : whatInProgress === "plan"
                      ? "Plan generating..."
                      : whatInProgress === "content"
                        ? "Content generating"
                        : !regenerate
                          ? "Generate PDF"
                          : "Restart generation"}
                </span>
              </Button>
            )}
          {Object.keys(chapterContent).length == 0 &&
            createdPlans > 0 &&
            generatePlanDone && (
              <Button
                className="w-full flex flex-row justify-evenly"
                onClick={regeneratePlan}>
                <span>
                  {whatInProgress === ""
                    ? "Initialization"
                    : whatInProgress === "plan"
                      ? "Plan generating..."
                      : whatInProgress === "content"
                        ? "Content generating"
                        : !regenerate
                          ? "Regenerate plan"
                          : "Restart generation"}
                </span>
              </Button>
            )}
          {(Object.keys(chapterContent).length == 0 || whatInProgress) &&
            createdPlans > 0 &&
            generatePlanDone && (
              <Button
                className="w-full flex flex-row justify-evenly"
                onClick={() => {
                  //   setGeneratePlanButton(true);
                }}>
                <span>
                  {whatInProgress === ""
                    ? "Initialization"
                    : whatInProgress === "content"
                      ? "Content generating"
                      : "Generate content"}
                </span>
              </Button>
            )}
        </>
      )}
      {whatInProgress && (
        <>
          <Tooltip id="cancelButtonTooltip">
            <strong>Cancel generation</strong>
          </Tooltip>
          <Button
            data-tooltip-id="cancelButtonTooltip"
            onClick={handleCancel}
            className="bg-red-500 hover:bg-opacity-90 hover:bg-red-500">
            <FontAwesomeIcon className="text-white" icon={faStop} />
          </Button>
        </>
      )}
      {!whatInProgress && responseSubject && (
        <Button onClick={handleTryAgain}>Recommencer</Button>
      )}
    </>
  );
};
