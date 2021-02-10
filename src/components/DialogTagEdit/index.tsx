import {yupResolver} from '@hookform/resolvers/yup'
import {Box, Button, Dialog, Flex} from '@sanity/ui'
import {DialogTagEdit} from '@types'
import React, {FC, ReactNode, useEffect} from 'react'
import {useForm} from 'react-hook-form'
import {useDispatch} from 'react-redux'
import * as yup from 'yup'

import useTypedSelector from '../../hooks/useTypedSelector'
import {dialogRemove, dialogShowDeleteConfirm} from '../../modules/dialog'
import {selectTagById, tagsUpdate} from '../../modules/tags'
import sanitizeFormData from '../../utils/sanitizeFormData'
import FormFieldInputText from '../FormFieldInputText'
import FormSubmitButton from '../FormSubmitButton'

type Props = {
  children: ReactNode
  dialog: DialogTagEdit
}

type FormData = yup.InferType<typeof formSchema>

const formSchema = yup.object().shape({
  name: yup.string().required('Name cannot be empty')
})

const DialogTagEdit: FC<Props> = (props: Props) => {
  const {
    children,
    dialog: {id, tagId}
  } = props

  // Redux
  const dispatch = useDispatch()
  const tagItem = useTypedSelector(state => selectTagById(state, String(tagId))) // TODO: double check string cast

  // react-hook-form
  const {
    // Read the formState before render to subscribe the form state through Proxy
    formState: {errors, isDirty, isValid},
    handleSubmit,
    register,
    setError
  } = useForm({
    defaultValues: {
      name: tagItem?.tag?.name?.current
    },
    mode: 'onChange',
    resolver: yupResolver(formSchema)
  })

  const formUpdating = !tagItem || tagItem?.updating

  // Callbacks
  const handleClose = () => {
    dispatch(dialogRemove(id))
  }

  // - submit react-hook-form
  const onSubmit = async (formData: FormData) => {
    if (!tagItem?.tag) {
      return
    }

    const sanitizedFormData = sanitizeFormData(formData)

    dispatch(
      tagsUpdate({
        closeDialogId: tagItem?.tag?._id,
        formData: {
          name: {
            _type: 'slug',
            current: sanitizedFormData.name
          }
        },
        tag: tagItem?.tag
      })
    )
  }

  const handleDelete = () => {
    if (!tagItem?.tag) {
      return
    }

    dispatch(
      dialogShowDeleteConfirm({
        closeDialogId: tagItem?.tag?._id,
        documentId: tagItem?.tag?._id,
        documentType: 'tag'
      })
    )
  }

  // Effects
  useEffect(() => {
    if (tagItem.error) {
      setError('name', {
        message: tagItem.error?.message
      })
    }
  }, [tagItem.error])

  const Footer = () => (
    <Box padding={3}>
      <Flex justify="space-between">
        {/* Delete button */}
        <Button
          disabled={formUpdating}
          fontSize={1}
          mode="bleed"
          onClick={handleDelete}
          text="Delete"
          tone="critical"
        />

        {/* Submit button */}
        <FormSubmitButton
          disabled={formUpdating || !isDirty || !isValid}
          isDirty={isDirty}
          isValid={isValid}
          lastUpdated={tagItem?.tag?._updatedAt}
          onClick={handleSubmit(onSubmit)}
        />
      </Flex>
    </Box>
  )

  return (
    <Dialog
      footer={<Footer />}
      header="Edit Tag"
      id={id}
      onClose={handleClose}
      scheme="dark"
      width={1}
    >
      {/* Form fields */}
      <Box as="form" padding={4} onSubmit={handleSubmit(onSubmit)}>
        {/* Hidden button to enable enter key submissions */}
        <button style={{display: 'none'}} tabIndex={-1} type="submit" />

        {/* Title */}
        <FormFieldInputText
          disabled={formUpdating}
          error={errors?.name}
          label="Name"
          name="name"
          ref={register}
        />
      </Box>

      {children}
    </Dialog>
  )
}

export default DialogTagEdit