// src/types/react-mentions.d.ts
declare module "react-mentions" {
    import * as React from "react";

    export interface SuggestionDataItem {
        id: string;
        display: string;
    }

    export interface MentionsInputProps
        extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
        value: string;
        onChange: (event: any) => void;
        singleLine?: boolean;
        allowSpaceInQuery?: boolean;
        markup?: string;
        displayTransform?: (id: string, display: string) => string;
        className?: string;
        placeholder?: string;
    }

    export interface MentionProps {
        trigger: string | RegExp;
        data: SuggestionDataItem[] | ((search: string, callback: (data: SuggestionDataItem[]) => void) => void);
        markup?: string;
        renderSuggestion?: (
            suggestion: SuggestionDataItem,
            search: string,
            highlightedDisplay: React.ReactNode,
            index: number,
            focused: boolean
        ) => React.ReactNode;
        displayTransform?: (id: string, display: string) => string;
    }

    export class MentionsInput extends React.Component<MentionsInputProps> { }
    export class Mention extends React.Component<MentionProps> { }
}
