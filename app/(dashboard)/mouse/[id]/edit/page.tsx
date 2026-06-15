'use client'
import EditEntityPage from '@/components/EditEntityPage'
import { STANDARD_ENTITY_CONFIGS } from '@/lib/forms/standard-entity-config'
export default function EditMouse() { return <EditEntityPage config={STANDARD_ENTITY_CONFIGS.mouse} /> }
