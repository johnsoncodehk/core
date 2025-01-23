import type {
  ComputedGetter,
  OnCleanup,
  ShallowUnwrapRef,
  WatchStopHandle,
} from '@vue/reactivity'
import type {
  AllowedComponentProps,
  ComponentCustomProps,
  ComponentInternalInstance,
  ComponentPublicInstance,
  VNodeProps,
  WatchOptions,
  nextTick,
} from '@vue/runtime-core'
import type { UnionToIntersection } from '@vue/shared'
import type { PropOptions } from './componentProps'

export type PublicProps = VNodeProps &
  AllowedComponentProps &
  ComponentCustomProps

export declare function defineComponent<
  TypeProps = unknown,
  TypeEmits = unknown,
  TypeEl = any,
  TypeRefs = {},
  Mixins extends any[] = [],
  Data = {},
  PropsOption = Record<string, PropOptions>,
  EmitsOption = {},
  PropKeys extends string = string,
  EventNames extends string = string,
  ComputedOptions extends Record<string, ComputedGetter<unknown>> = {},
  Methods = {},
  SetupReturns = {},
  // Resolving...
  Props = (TypeProps extends unknown
    ? ResolvePropsOption<PropsOption, PropKeys>
    : TypeProps) &
    PublicProps,
  Emit = TypeEmits extends unknown
    ? ResolveEmitsOption<EmitsOption, EventNames>
    : TypeEmits,
  SetupContext = {
    attrs: Data
    slots: any // UnwrapSlotsType<S>
    emit: Emit
    expose: <Exposed extends Record<string, any> = Record<string, any>>(
      exposed?: Exposed,
    ) => void
  },
  _InstanceType = Data &
    Props &
    Methods &
    ShallowUnwrapRef<SetupReturns> & {
      [K in keyof ComputedOptions]: ReturnType<ComputedOptions[K]>
    } & {
      $: ComponentInternalInstance
      $data: Data
      $props: Props
      $attrs: Data
      $refs: Data & TypeRefs
      // $slots: UnwrapSlotsType<S>
      $root: ComponentPublicInstance | null
      $parent: ComponentPublicInstance | null
      $host: Element | null
      $emit: Emit
      $el: TypeEl
      // $options: Options & MergedComponentOptionsOverride
      $forceUpdate: () => void
      $nextTick: typeof nextTick
      $watch<T extends string | ((...args: any) => any)>(
        source: T,
        cb: T extends (...args: any) => infer R
          ? (...args: [R, R, OnCleanup]) => any
          : (...args: [any, any, OnCleanup]) => any,
        options?: WatchOptions,
      ): WatchStopHandle
    } & ResolveMixins<UnionToIntersection<Mixins[number]>>,
>(
  _:
    | ({
        [key: string]: unknown
        /**
         * @private for language-tools use only
         */
        __typeProps?: TypeProps
        /**
         * @private for language-tools use only
         */
        __typeEmits?: TypeEmits
        /**
         * @private for language-tools use only
         */
        __typeRefs?: TypeRefs
        /**
         * @private for language-tools use only
         */
        __typeEl?: TypeEl
        mixins?: Mixins
        props?: PropsOption | PropKeys[]
        emits?: EmitsOption | EventNames[]
        computed?: ComputedOptions
        methods?: Methods
        data?: () => Data
        setup?(this: void, props: Props, ctx: SetupContext): SetupReturns
      } & ThisType<_InstanceType>)
    | ((this: void, props: Props, ctx: SetupContext) => SetupReturns),
): {
  new (): _InstanceType
}

//#region mixins
type ResolveMixins<Mixins> = Mixins extends new (...args: any) => any
  ? InstanceType<Mixins>
  : Mixins
//#endregion

//#region emits
type ResolveEmitsOption<EmitsOption, EventNames> = EmitsOption extends string[]
  ? (event: EventNames, ...args: any) => void
  : keyof EmitsOption extends never
    ? (event: string, ...args: any) => void
    : UnionToIntersection<
        {
          [K in keyof EmitsOption]: (
            event: K,
            ...params: EmitsOption[K] extends (...args: any) => any
              ? Parameters<EmitsOption[K]>
              : any
          ) => void
        }[keyof EmitsOption]
      >
//#endregion

//#region props
type ResolvePropsOption<
  PropsOption,
  PropKeys extends string,
> = PropsOption extends string[]
  ? {
      [K in PropKeys]: any
    }
  : {
      [K in keyof PropsOption]: PropsOption[K] extends {
        type: infer Type
      }
        ? ResolvePropType<Type>
        : PropsOption[K]
    }

type ResolvePropType<PropType> = PropType extends new (...args: any) => any
  ? ResolvePropInstanceType<InstanceType<PropType>>
  : PropType

type ResolvePropInstanceType<PropInstanceType> = PropInstanceType extends {
  valueOf(): infer Value
}
  ? Value
  : PropInstanceType
//#endregion
