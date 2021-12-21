import { classNames, escapeRegExp } from '../../../functions'

import React from 'react'

const inputRegex = RegExp(`^\\d*$`) // match escaped "." characters via in a non-capturing group

export const CashAddressInput = React.memo(
  ({
    value,
    onUserInput,
    placeholder,
    className = 'flex w-full h-full p-3 font-bold rounded overflow-ellipsis recipient-address-input bg-dark-900 placeholder-low-emphesis',
    align,
    fontSize = '24px',
    ...rest
  }: {
    value: string
    onUserInput: (input: string) => void
    error?: boolean
    fontSize?: string
    align?: 'right' | 'left'
  } & Omit<React.HTMLProps<HTMLInputElement>, 'ref' | 'onChange' | 'as'>) => {
    const enforcer = (nextUserInput: string) => {
      onUserInput(nextUserInput)
    }

    return (
      <>
        <input
          value={value}
          onChange={(event) => {
            enforcer(event.target.value.replace(/\s+/g, ''))
          }}
          // universal input options
          inputMode="text"
          title="Wallet CashAddress"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          placeholder="Wallet CashAddress"
          pattern="^bitcoincash:.*$"
          // text-specific options
          type="text"
          className={classNames(
            align === 'right' && 'text-right',
            'font-medium bg-transparent whitespace-nowrap overflow-ellipsis flex-auto',
            className
          )}
          style={{ fontSize }}
          {...rest}
        />
      </>
    )
  }
)

CashAddressInput.displayName = 'CashAddressInput'

export default CashAddressInput

// const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`) // match escaped "." characters via in a non-capturing group
