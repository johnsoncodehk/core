import type {
  ComputedGetter,
  OnCleanup,
  ShallowUnwrapRef,
  WatchStopHandle,
} from '@vue/reactivity'
import type {
  AllowedComponentProps,
  Component,
  ComponentCustomProperties,
  ComponentCustomProps,
  ComponentInjectOptions,
  ComponentInternalInstance,
  ComponentPublicInstance,
  ConcreteComponent,
  Directive,
  ExtractPropTypes,
  ExtractPublicPropTypes,
  Prop,
  RuntimeCompilerOptions,
  SlotsType,
  VNodeProps,
  WatchOptions,
  nextTick,
} from '@vue/runtime-core'
import type { UnionToIntersection } from '@vue/shared'
import type { DebuggerHook, ErrorCapturedHook } from './apiLifecycle'
import type { CompatConfig } from './compat/compatConfig'
import type { ComponentInternalOptions } from './component'
import type { ComponentWatchOptions } from './componentOptions'
import type { UnwrapSlotsType } from './componentSlots'

export type PublicProps = VNodeProps &
  AllowedComponentProps &
  ComponentCustomProps

export declare function defineComponent<
  TypeProps = unknown,
  TypeEmits = unknown,
  TypeEl = any,
  TypeRefs = {},
  Components extends Record<string, Component> = {},
  Directives extends Record<string, Directive> = {},
  Slots extends SlotsType = {},
  Exposed extends string = string,
  Mixin = {},
  Data = {},
  PropsOption extends Record<string, Prop<unknown> | null> = Record<
    string,
    Prop<unknown> | null
  >,
  EmitsOption = {},
  InjectOption extends ComponentInjectOptions = {},
  PropKeys extends string | unknown = unknown,
  EventNames extends string | unknown = unknown,
  InjectKeys extends string = string,
  ComputedOptions extends Record<string, ComputedGetter<unknown>> = {},
  Methods = {},
  SetupReturns = {},
  // Resolving...
  Emit = TypeEmits extends unknown
    ? ResolveEmitsOption<EmitsOption, EventNames>
    : TypeEmits,
  EmitEvents = TypeEmits extends unknown
    ? EmitsOption /* TODO: convert return type to void */
    : NormalizeEmits<TypeEmits>,
  EmitEventProps = {
    [K in string & keyof EmitEvents as `on${Capitalize<K>}`]?:
      | EmitEvents[K]
      | EmitEvents[K][]
  },
  InternalProps = (TypeProps extends unknown
    ? PropKeys extends string
      ? {
          [K in PropKeys]?: any
        }
      : ExtractPropTypes<PropsOption>
    : TypeProps) &
    EmitEventProps,
  ExternalProps = (TypeProps extends unknown
    ? PropKeys extends string
      ? {
          [K in PropKeys]?: any
        }
      : ExtractPublicPropTypes<PropsOption>
    : TypeProps) &
    EmitEventProps &
    PublicProps,
  SetupContext = {
    attrs: Data
    slots: UnwrapSlotsType<Slots>
    emit: Emit
    expose: <Exposed extends Record<string, any> = Record<string, any>>(
      exposed?: Exposed,
    ) => void
  },
  _InstanceType = Data &
    InternalProps &
    Methods &
    ComponentCustomProperties &
    ShallowUnwrapRef<SetupReturns> & {
      [K in keyof ComputedOptions]: ReturnType<ComputedOptions[K]>
    } & {
      $: ComponentInternalInstance
      $data: Data
      $attrs: Data
      $refs: Data & TypeRefs
      $slots: UnwrapSlotsType<Slots>
      $root: ComponentPublicInstance | null
      $parent: ComponentPublicInstance | null
      $host: Element | null
      $emit: Emit
      $el: TypeEl
      $options: any // Options & MergedComponentOptionsOverride
      $forceUpdate: () => void
      $nextTick: typeof nextTick
      $watch<T extends string | ((...args: any) => any)>(
        source: T,
        cb: T extends (...args: any) => infer R
          ? (...args: [R, R, OnCleanup]) => any
          : (...args: [any, any, OnCleanup]) => any,
        options?: WatchOptions,
      ): WatchStopHandle
    } & ResolveMixins<UnionToIntersection<Mixin>>,
>(
  _:
    | ({
        props?: PropsOption | PropKeys[]

        //#region ComponentOptionsBase
        setup?(
          this: void,
          props: InternalProps,
          ctx: SetupContext,
        ): SetupReturns
        name?: string
        template?: string | object // can be a direct DOM node
        // Note: we are intentionally using the signature-less `Function` type here
        // since any type with signature will cause the whole inference to fail when
        // the return expression contains reference to `this`.
        // Luckily `render()` doesn't need any arguments nor does it care about return
        // type.
        render?: Function
        // NOTE: extending both LC and Record<string, Component> allows objects to be forced
        // to be of type Component, while still inferring LC generic
        components?: Components
        // NOTE: extending both Directives and Record<string, Directive> allows objects to be forced
        // to be of type Directive, while still inferring Directives generic
        directives?: Directives
        inheritAttrs?: boolean
        emits?: EmitsOption | EventNames[]
        slots?: Slots
        expose?: Exposed[]
        serverPrefetch?(): void | Promise<any>

        // Runtime compiler only -----------------------------------------------------
        compilerOptions?: RuntimeCompilerOptions

        // Internal ------------------------------------------------------------------

        /**
         * SSR only. This is produced by compiler-ssr and attached in compiler-sfc
         * not user facing, so the typing is lax and for test only.
         * @internal
         */
        ssrRender?: (
          ctx: any,
          push: (item: any) => void,
          parentInstance: ComponentInternalInstance,
          attrs: Data | undefined,
          // for compiler-optimized bindings
          $props: ComponentInternalInstance['props'],
          $setup: ComponentInternalInstance['setupState'],
          $data: ComponentInternalInstance['data'],
          $options: ComponentInternalInstance['ctx'],
        ) => void

        /**
         * Only generated by compiler-sfc to mark a ssr render function inlined and
         * returned from setup()
         * @internal
         */
        __ssrInlineRender?: boolean

        /**
         * marker for AsyncComponentWrapper
         * @internal
         */
        __asyncLoader?: () => Promise<ConcreteComponent>
        /**
         * the inner component resolved by the AsyncComponentWrapper
         * @internal
         */
        __asyncResolved?: ConcreteComponent
        /**
         * Exposed for lazy hydration
         * @internal
         */
        __asyncHydrate?: (
          el: Element,
          instance: ComponentInternalInstance,
          hydrate: () => void,
        ) => void

        // Type differentiators ------------------------------------------------------

        // Note these are internal but need to be exposed in d.ts for type inference
        // to work!

        // type-only differentiator to separate OptionWithoutProps from a constructor
        // type returned by defineComponent() or FunctionalComponent
        call?: (this: unknown, ...args: unknown[]) => never
        // type-only differentiators for built-in Vnode types
        __isFragment?: never
        __isTeleport?: never
        __isSuspense?: never

        // __defaults?: Defaults
        //#endregion

        //#region LanguageToolsOptions
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
        //#endregion

        //#region LegacyOptions
        [key: string]: unknown
        compatConfig?: CompatConfig
        data?: () => Data
        computed?: ComputedOptions
        methods?: Methods
        watch?: ComponentWatchOptions
        // provide?: Provide
        inject?: InjectOption | InjectKeys[]
        // assets
        filters?: Record<string, Function>

        // composition
        mixins?: Mixin[]
        // extends?: Extends

        // lifecycle
        beforeCreate?(): any
        created?(): any
        beforeMount?(): any
        mounted?(): any
        beforeUpdate?(): any
        updated?(): any
        activated?(): any
        deactivated?(): any
        /** @deprecated use `beforeUnmount` instead */
        beforeDestroy?(): any
        beforeUnmount?(): any
        /** @deprecated use `unmounted` instead */
        destroyed?(): any
        unmounted?(): any
        renderTracked?: DebuggerHook
        renderTriggered?: DebuggerHook
        errorCaptured?: ErrorCapturedHook

        /**
         * runtime compile only
         * @deprecated use `compilerOptions.delimiters` instead.
         */
        delimiters?: [string, string]

        /**
         * #3468
         *
         * type-only, used to assist Mixin's type inference,
         * typescript will try to simplify the inferred `Mixin` type,
         * with the `__differentiator`, typescript won't be able to combine different mixins,
         * because the `__differentiator` will be different
         */
        __differentiator?: keyof Data | keyof ComputedOptions | keyof Methods
        //#endregion
      } & ThisType<_InstanceType & { $props: InternalProps }>)
    | ((this: void, props: InternalProps, ctx: SetupContext) => SetupReturns),
): ComponentInternalOptions & {
  new (): _InstanceType & { $props: ExternalProps }
}

//#region NormalizeEmits
type NormalizeEmits<T> = UnionToIntersection<
  ConstructorOverloads<T> & {
    [K in keyof T]: T[K] extends any[] ? { (...args: T[K]): void } : never
  }
>
type OverloadUnionInner<T, U = unknown> = U & T extends (
  ...args: infer A
) => infer R
  ? U extends T
    ? never
    :
        | OverloadUnionInner<T, Pick<T, keyof T> & U & ((...args: A) => R)>
        | ((...args: A) => R)
  : never
type OverloadUnion<T> = Exclude<
  OverloadUnionInner<(() => never) & T>,
  T extends () => never ? never : () => never
>
type ConstructorOverloads<T> =
  OverloadUnion<T> extends infer F
    ? F extends (event: infer E, ...args: infer A) => any
      ? { [K in E & string]: (...args: A) => void }
      : never
    : never
//#endregion

//#region mixins
type ResolveMixins<Mixins> = Mixins extends new (...args: any) => any
  ? InstanceType<Mixins>
  : Mixins
//#endregion

//#region emits
type ResolveEmitsOption<
  EmitsOption,
  EventNames extends string | unknown,
> = EventNames extends string
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
