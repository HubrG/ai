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
  chapterContent: number;
  createdPlans: number;
  whatInProgress: string;
  loading: boolean;
  setGeneratePlanButtonState: (state: boolean) => void;
  disabled?: boolean;
}
export const GenerateButton = ({
  whatInProgress,
  createdPlans,
  chapterContent,
  setGeneratePlanButtonState,
  handleCancel,
  regeneratePlan,
  generatePlan,
  loading,
  disabled,
}: Props) => {
  return (
    <>
      {whatInProgress === "plan" || whatInProgress === "content" || loading ? (
        <Button className="w-full flex flex-row justify-evenly" disabled={true}>
          <Loader />
          <span>
            {whatInProgress === "plan" ? "Plan generation..." : ""}
            {whatInProgress === "content" ? "Content generation..." : ""}
            {loading && !whatInProgress ? "Initialization..." : ""}
          </span>
        </Button>
      ) : (
        <>
          {chapterContent == 0 && createdPlans == 0 && !loading && (
            <Button
              disabled={disabled}
              className="w-full flex flex-row justify-evenly"
              onClick={generatePlan}>
              <span>Generate PDF</span>
            </Button>
          )}
          {chapterContent == 0 && createdPlans > 0 && !loading && (
            <>
              <div className="flex flex-col gap-2 w-full">
                <Button
                  variant={"outline"}
                  className="w-full flex flex-row justify-evenly"
                  onClick={regeneratePlan}>
                  <span>Regenerate plan</span>
                </Button>
                <Button
                  className="w-full flex flex-row justify-evenly"
                  onClick={() => setGeneratePlanButtonState(true)}>
                  <span>Generate all content</span>
                </Button>
              </div>
            </>
          )}
        </>
      )}
      {loading && (
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
    </>
  );
};