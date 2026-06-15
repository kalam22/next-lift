'use client'
import EditEntityPage from '@/components/EditEntityPage'
import { STANDARD_ENTITY_CONFIGS } from '@/lib/forms/standard-entity-config'
export default function EditUPS() { return <EditEntityPage config={STANDARD_ENTITY_CONFIGS.ups} /> }
