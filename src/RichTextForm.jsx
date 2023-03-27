import { DevTool } from "@hookform/devtools"
import classNames from "classnames"
import React, { useState, useCallback, useId, useEffect } from "react"
import { FormProvider, useForm, useFormContext, useWatch } from "react-hook-form"
import { Node, createEditor, Editor, Text} from "slate"
import { withReact, Slate, Editable, useReadOnly, useSelected, useSlate} from "slate-react"

const HideTextContext = React.createContext(false)

const Comment = (props) => {
    const readOnly = useReadOnly()
    const { comment, className } = props
    if(!comment)
        return <button 
                    contentEditable={false} 
                    type="button" 
                    className={classNames("mx-0.5 shadow-sm border border-gray-200 rounded-sm px-1 py-px bg-white text-gray-400 text-sm",
                    {"invisible group-hover:visible": readOnly, "visible": !readOnly},
                    className
                    )}>
                        {readOnly ? "+ Add Comment" : "comments"}
                </button>
    return <span className="text-gray-400 text-sm">{comment}</span>
}
   


// Define a React component renderer for our code blocks.
const InputElement = props => {
    const {register} = useFormContext()
    const placeholder = Node.string(props.element)
    const selected = useSelected()
    const readonly = useReadOnly()
    return (
        <span  {...props.attributes} className="relative group">
            <input 
                {...register(props.element.name, {disabled: !readonly })}
                placeholder={placeholder}
                type="text" 
                className={classNames("rounded-md border border-gray-300 focus:border-blue-500 placeholder:text-gray-400", {"border-blue-500 ring-1 ring-blue-500": selected, "border-gray-300": !selected})}
            />
            {props.children}
        </span>
    )
}

const RadioElement = props => {
    const {register} = useFormContext()
    const id = useId()
    const readonly = useReadOnly()
    return (
        <div  {...props.attributes} className="relative group flex items-center">
            <input 
                {...register(props.element.name, {disabled: !readonly})}
                id={id}
                value={props.element.value}
                type="radio" 
                className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500" 
            />
            <HideTextContext.Provider value={false}>
                <label htmlFor={id} className="ml-1 block text-sm font-medium leading-6 text-gray-900">{props.children}</label>
            </HideTextContext.Provider>
            <Comment/>
        </div>
    )
}


const SelectElement = props => {
    const {register} = useFormContext()
    const placeholder = Node.string(props.element)
    const readonly = useReadOnly()
    const selected = useSelected()
    return (
        <span  {...props.attributes}>
            <select
                {...register(props.element.name, {disabled: !readonly})}
                placeholder={placeholder}
                tabIndex={-1}
                className={classNames("rounded-md border border-gray-300 focus:border-blue-500 placeholder:text-gray-400", {"border-blue-500 ring-1 ring-blue-500": selected, "border-gray-300": !selected})}
            >
                {props.element.options.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>
            {props.children}
        </span>
    )   
}

const TextArea = props => {
    const placeholder = Node.string(props.element)
    const {register} = useFormContext()
    const readonly = useReadOnly()
    const selected = useSelected()
    return (
        <div  {...props.attributes} className="mt-1">
            <textarea
                {...register(props.element.name, {disabled: !readonly})}
                placeholder={placeholder}
                tabIndex={-1}
                className={classNames("w-full p-1 rounded-md border border-gray-300 focus:border-blue-500 placeholder:text-gray-400", {"border-blue-500 ring-1 ring-blue-500": selected, "border-gray-300": !selected})}   
            />
            {props.children}
        </div>
    )
}

const DefaultElement = props => {
    return <p {...props.attributes} className="group">{props.children}<Comment/></p>
}

const DefaultLeaf = props => {
    const hideText = React.useContext(HideTextContext)
    return <span {...props.attributes} className={hideText ? "hidden": ""}>{props.children}</span>
}

const FormData = props => {
    return (
        <details>
            <summary className="mt-3 text-gray-400 uppercase text-sm border-b">data</summary>
            <pre className="mt-1 text-sm text-gray-900">
                {JSON.stringify(props.data, null, 2)} 
            </pre>
        </details>
    )
}

const serialize = (node, editor,values) => {
    if (Text.isText(node)) {
      return node.text
    }

    if (!!node && values && node.name && "name" in node && node.name in values) {
        return values[node.name]
    }
    const childrenAreInline = Editor.isInline(editor, node?.children[0])
    const children = node?.children.map(n => serialize(n, editor, values)).join(childrenAreInline ? '' :'\n')
    return children || ''
    
  }

const PlainText = props => {
    const nodes = props.nodes 
    const editor = useSlate()
    const {getValues, watch} = useFormContext()
    const values = getValues()
    if (!values || !nodes) return null
    return (
        <div>
            <div className="mt-3 text-gray-400 uppercase text-sm border-b">Text generation</div>
            <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                {nodes.map(node => serialize(node, editor, watch())).join('\n')}
            </p>
        </div>
    )
}

const INLINE_TYPES  = ['text', 'select']
const VOID_TYPES = ['text', 'select', 'textarea']

const withInlineVoid = editor => {
    const { isInline, isVoid } = editor

    editor.isInline = element => {
        return INLINE_TYPES.includes(element.type) ? true : isInline(element)
    }
    editor.isVoid = element => {
        return VOID_TYPES.includes(element.type) ? true : isVoid(element)
    }
    return editor
}

const initialValue = [
    {
      children: [{ text: 'A line of text in a paragraph.' }],
    },
    {
      children: [
        { text: 'A line of text in a paragraph.' }, 
        { type: "text", name: "text-1", children:[{text:""}]},
        { text: 'A line of text in a paragraph.' },
      ],
    },
    {
        children: [
            { text: 'A line of text in a paragraph.' },
            { type: "select", name: "select-1", options: [{value: "1", label: "Option 1"}, {value: "2", label: "Option 2"}], children:[{text:""}]},
            { text: 'A line of text in a paragraph.' },
        ], 
    },
    {
        name: "radio-1",
        type: "radio",
        value: "1",
        children: [
            {text: "choice 1"}
        ]
    },
    {
        name: "radio-1",
        value: "2",
        type: "radio",
        children: [
            {text: "choice 2"}
        ]
    },
    {
        type: "textarea",
        name: "textarea-1",
        children: [
            {text: ""}
        ]
    }
  ]
  
export default function  RichTextForm(){
    const [readOnly, setReadonly] = useState(true)
    const [hideText, setHideText] = useState(false)
    const [editor] = useState(() => withInlineVoid(withReact(createEditor())))
    const renderElement = useCallback(props => {
        switch (props.element.type) {
            case 'comment':
                return <CommentElement {...props} />
            case 'text':
                return <InputElement {...props} />
            case 'select':
                return <SelectElement {...props} />
            case 'radio':
                return <RadioElement {...props} />
            case 'textarea':
                return <TextArea {...props} />
            default:
                return <DefaultElement {...props} />
        }
      }, [])

    const renderLeaf = useCallback(props => {
        return <DefaultLeaf {...props} />
    }, [])
    const methods = useForm({mode: "onChange"})
    const [data, setData] = useState({})
    const [content, setContent] = useState(initialValue)
    return (
        <div className="p-4">
            <FormProvider {...methods}>
                <Slate editor={editor} value={content} onChange={setContent}>
                    <div>
                        <label>
                            <span>Read only: </span>
                            <input type="checkbox" checked={readOnly} onChange={event => setReadonly(v => !v)}/>
                        </label>
                    </div>
                    <div>
                        <label>
                            <span>Hide text: </span>
                            <input type="checkbox" checked={hideText} onChange={event => setHideText(v => !v)}/>
                        </label>
                    </div>
                    <div className="text-gray-400 uppercase text-sm mt-2">Answer</div>
                    <HideTextContext.Provider value={hideText}>
                        <form onInput={methods.handleSubmit(setData)}>
                            <Editable
                                className="p-2 rounded-md border border-gray-300 text-sm font-normal"
                                readOnly={readOnly}
                                renderElement={renderElement}
                                renderLeaf={renderLeaf}
                            />
                        </form>
                    </HideTextContext.Provider>
                    <details>
                    <summary className="mt-3 text-gray-400 uppercase text-sm border-b">content</summary>
                        <pre className="text-sm">
                            {JSON.stringify(content, null, 2)}
                        </pre>
                    </details>
                    <FormData data={data}/>
                    <PlainText nodes={content} />
                    <DevTool control={methods.control} /> {/* set up the dev tool */}
                </Slate>
            </FormProvider>
        </div>
    )
  }