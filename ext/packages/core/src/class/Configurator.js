/**
 * @class Ext.Configurator
 * This class manages the config properties for a class.
 * @private
 */
(function() { // see end of file (and please don't indent the whole file)

var ExtConfig = Ext.Config,
    configPropMap = ExtConfig.map,
    ExtObject = Ext.Object;

Ext.Configurator = function(cls) {
// @define Ext.class.Configurator
// @define Ext.Configurator
// @require Ext.Config

    var me = this,
        prototype = cls.prototype,
        superCfg = cls.superclass ? cls.superclass.self.$config : null;

    /**
     * @property {Ext.Class} cls The class to which this instance is associated.
     * @private
     * @readonly
     */
    me.cls = cls;

    /**
     * The super class `Configurator` instance or `null` if there is no super class.
     *
     * @property {Ext.Configurator} superCfg
     * @private
     * @readonly
     */
    me.superCfg = superCfg;

    if (superCfg) {
        /**
         * This object holds an `Ext.Config` value for each config property keyed by name.
         * This object has as its prototype object the `configs` of its super class.
         * 
         * This map is maintained as each property is added via the `add` method.
         * 
         * @property {Object} configs
         * @private
         * @readonly
         */
        me.configs = ExtObject.chain(superCfg.configs);

        /**
         * This object holds a bool value for each cachedConfig property keyed by name.
         * 
         * This map is maintained as each property is added via the `add` method.
         * 
         * @property {Object} cachedConfigs
         * @private
         * @readonly
         */
        me.cachedConfigs = ExtObject.chain(superCfg.cachedConfigs);

        /**
         * This object holds a `Number` for each config property keyed by name. This object has
         * as its prototype object the `initMap` of its super class. The value of each property
         * has the following meaning:
         * 
         *   * `0` - initial value is `null` and requires no processing.
         *   * `1` - initial value must be set on each instance.
         *   * `2` - initial value can be cached on the prototype by the first instance.
         *
         * Any `null` values will either never be added to this map or (if added by a base
         * class and set to `null` by a derived class) will cause the entry to be 0.
         * 
         * This map is maintained as each property is added via the `add` method.
         * 
         * @property {Object} initMap
         * @private
         * @readonly
         */
        me.initMap = ExtObject.chain(superCfg.initMap);

        /**
         * This object holds the default value for each config property keyed by name. This
         * object has as its prototype object the `values` of its super class.
         * 
         * This map is maintained as each property is added via the `add` method.
         * 
         * @property {Object} values
         * @private
         * @readonly
         */
        me.values = ExtObject.chain(superCfg.values);

        me.needsFork = superCfg.needsFork;

        //<debug>
        // The reason this feature is debug only is that we would have to create this
        // map for all classes because deprecations could be added to bases after the
        // derived class had created its Configurator.
        me.deprecations = ExtObject.chain(superCfg.deprecations);
        //</debug>
    }
    else {
        me.configs = {};
        me.cachedConfigs = {};
        me.initMap = {};
        me.values = {};

        //<debug>
        me.deprecations = {};
        //</debug>
    }

    prototype.config = prototype.defaultConfig = me.values;
    cls.$config = me;
};

Ext.Configurator.prototype = {
    self: Ext.Configurator,

    needsFork: false,

    /**
     * This array holds the properties that need to be set on new instances.
     * 
     * This array is populated when the first instance is passed to `configure` (basically
     * when the first instance is created). The entries in `initMap` are iterated to find
     * those configs needing per-instance processing.
     * 
     * @property {Ext.Config[]} initList
     * @private
     */
    initList: null,

    /**
     * This method adds new config properties. This is called for classes when they are
     * declared, then for any mixins that class may define and finally for any overrides
     * defined that target the class.
     * 
     * @param {Object} config The config object containing the new config properties.
     * @param {Ext.Class} [mixinClass] The mixin class if the configs are from a mixin.
     * @private
     */
    add: function(config, mixinClass) {
        var me = this,
            Cls = me.cls,
            configs = me.configs,
            cachedConfigs = me.cachedConfigs,
            initMap = me.initMap,
            prototype = Cls.prototype,
            mixinConfigs = mixinClass && mixinClass.$config.configs,
            values = me.values,
            isObject, meta, isCached, merge,
            cfg, currentValue, name, names, s, value;

        for (name in config) {
            value = config[name];
            isObject = value && value.constructor === Object;
            meta = isObject && '$value' in value ? value : null;
            isCached = false;

            if (meta) {
                isCached = !!meta.cached;
                value = meta.$value;
                isObject = value && value.constructor === Object;
            }

            merge = meta && meta.merge;

            cfg = configs[name];

            if (cfg) {
                // Only proceed with a mixin if we have a custom merge.
                if (mixinClass) {
                    merge = cfg.merge;

                    if (!merge) {
                        continue;
                    }

                    // Don't want the mixin meta modifying our own
                    meta = null;
                }
                else {
                    merge = merge || cfg.merge;
                }

                //<debug>
                // This means that we've already declared this as a config in a superclass
                // Let's not allow us to change it here.
                if (!mixinClass && isCached && !cachedConfigs[name]) {
                    Ext.raise('Redefining config as cached: ' + name + ' in class: ' +
                              Cls.$className);
                }
                //</debug>

                // There is already a value for this config and we are not allowed to
                // modify it. So, if it is an object and the new value is also an object,
                // the result is a merge so we have to merge both on to a new object.
                currentValue = values[name];

                if (merge) {
                    value = merge.call(cfg, value, currentValue, Cls, mixinClass);
                }
                else if (isObject) {
                    if (currentValue && currentValue.constructor === Object) {
                        // We favor moving the cost of an "extra" copy here because this
                        // is likely to be a rare thing two object values for the same
                        // property. The alternative would be to clone the initial value
                        // to make it safely modifiable even though it is likely to never
                        // need to be modified.
                        value = Ext.merge({}, currentValue, value);
                    }
                    // else "currentValue" is a primitive so "value" can just replace it
                }
                // else "value" is a primitive and it can just replace currentValue
            }
            else {
                // This is a new property value, so add it to the various maps "as is".
                // In the majority of cases this value will not be overridden or need to
                // be forked.
                if (mixinConfigs) {
                    // Since this is a config from a mixin, we don't want to apply its
                    // meta-ness because it already has. Instead we want to use its cfg
                    // instance:
                    cfg = mixinConfigs[name];
                    meta = null;
                }
                else {
                    cfg = ExtConfig.get(name);
                }

                configs[name] = cfg;

                if (cfg.cached || isCached) {
                    cachedConfigs[name] = true;
                }

                // Ensure that the new config has a getter and setter. Because this method
                // is called during class creation as the "config" (or "cachedConfig") is
                // being processed, the user's methods will not be on the prototype yet.
                // 
                // This has the following trade-offs:
                // 
                // - Custom getters are rare so there is minimal waste generated by them.
                // 
                // - Custom setters are more common but, by putting the default setter on
                //   the prototype prior to addMembers, when the user methods are added
                //   callParent can be used to call the generated setter. This is almost
                //   certainly desirable as the setter has some very important semantics
                //   that a custom setter would probably want to preserve by just adding
                //   logic before and/or after the callParent.
                //   
                // - By not adding these to the class body we avoid all the "is function"
                //   tests that get applied to each class member thereby streamlining the
                //   downstream class creation process.
                //
                // We still check for getter and/or setter but primarily for reasons of
                // backwards compatibility and "just in case" someone relied on inherited
                // getter/setter even though the base did not have the property listed as
                // a "config" (obscure case certainly).
                //
                names = cfg.names;

                if (!prototype[s = names.get]) {
                    prototype[s] = cfg.getter || cfg.getGetter();
                }

                if (!prototype[s = names.set]) {
                    prototype[s] = (meta && meta.evented)
                        ? (cfg.eventedSetter || cfg.getEventedSetter())
                        : (cfg.setter || cfg.getSetter());
                }
            }

            if (meta) {
                if (cfg.owner !== Cls) {
                    configs[name] = cfg = Ext.Object.chain(cfg);
                    cfg.owner = Cls;
                }

                Ext.apply(cfg, meta);

                delete cfg.$value;
            }

            // Fork checks all the default values to see if they are arrays or objects
            // Do this to save us from doing it on each run
            if (!me.needsFork && value &&
                (value.constructor === Object || value instanceof Array)) {
                me.needsFork = true;
            }

            // If the value is non-null, we need to initialize it.
            if (value !== null) {
                initMap[name] = true;
            }
            else {
                if (prototype.$configPrefixed) {
                    prototype[configs[name].names.internal] = null;
                }
                else {
                    prototype[configs[name].name] = null;
                }

                if (name in initMap) {
                    // Only set this to false if we already have it in the map, otherwise,
                    // just leave it out!
                    initMap[name] = false;
                }
            }

            values[name] = value;
        }
    },

    //<debug>
    addDeprecations: function(configs) {
        var me = this,
            deprecations = me.deprecations,
            className = (me.cls.$className || '') + '#',
            message, newName, oldName;

        for (oldName in configs) {
            newName = configs[oldName];

            //      configs: {
            //          dead: null,
            //
            //          renamed: 'newName',
            //
            //          removed: {
            //              message: 'This config was replaced by pixie dust'
            //          }
            //      }

            if (!newName) {
                message = 'This config has been removed.';
            }
            else if (!(message = newName.message)) {
                message = 'This config has been renamed to "' + newName + '"';
            }

            deprecations[oldName] = className + oldName + ': ' + message;
        }
    },
    //</debug>

    /**
     * This method configures the given `instance` using the specified `instanceConfig`.
     * The given `instance` should have been created by this object's `cls`.
     * 
     * @param {Object} instance The instance to configure.
     * @param {Object} instanceConfig The configuration properties to apply to `instance`.
     * @private
     */
    configure: function(instance, instanceConfig) {
        var me = this,
            configs = me.configs,
            //<debug>
            deprecations = me.deprecations,
            //</debug>
            initMap = me.initMap,
            initListMap = me.initListMap,
            initList = me.initList,
            prototype = me.cls.prototype,
            values = me.values,
            remaining = 0,
            firstInstance = !initList,
            cachedInitList, cfg, getter, i, internalName,
            ln, names, name, value, isCached, valuesKey, field, transforms;

        values = me.needsFork ? ExtObject.fork(values) : ExtObject.chain(values);

        // Let apply/update methods know that the initConfig is currently running.
        instance.isConfiguring = true;

        if (firstInstance) {
            // When called to configure the first instance of the class to which we are
            // bound we take a bit to plan for instance 2+.
            me.initList = initList = [];
            me.initListMap = initListMap = {};
            instance.isFirstInstance = true;

            for (name in initMap) {
                cfg = configs[name];
                isCached = cfg.cached;

                if (initMap[name]) {
                    names = cfg.names;
                    value = values[name];

                    if (!prototype[names.set].$isDefault ||
                                prototype[names.apply] || prototype[names.update] ||
                                typeof value === 'object') {
                        if (isCached) {
                            // This is a cachedConfig, so it needs to be initialized with
                            // the default value and placed on the prototype... but the
                            // instanceConfig may have a different value so the value may
                            // need resetting. We have to defer the call to the setter so
                            // that all of the initGetters are set up first.
                            (cachedInitList || (cachedInitList = [])).push(cfg);
                        }
                        else {
                            // Remember this config so that all instances (including this
                            // one) can invoke the setter to properly initialize it.
                            initList.push(cfg);
                            initListMap[name] = true;
                        }

                        // Point all getters to the initGetters. By doing this here we
                        // avoid creating initGetters for configs that don't need them
                        // and we can easily pick up the cached fn to save the call.
                        instance[names.get] = cfg.initGetter || cfg.getInitGetter();
                    }
                    else {
                        // Non-object configs w/o custom setter, applier or updater can
                        // be simply stored on the prototype.
                        prototype[cfg.getInternalName(prototype)] = value;
                    }
                }
                else if (isCached) {
                    prototype[cfg.getInternalName(prototype)] = undefined;
                }
            }
        }

        // TODO - we need to combine the cached loop with the instanceConfig loop to
        // avoid duplication of init getter setups (for correctness if a cached cfg
        // calls on a non-cached cfg)

        ln = cachedInitList && cachedInitList.length;

        if (ln) {
            // This is only ever done on the first instance we configure. Any config in
            // cachedInitList has to be set to the default value to allow any side-effects
            // or transformations to occur. The resulting values can then be elevated to
            // the prototype and this property need not be initialized on each instance.

            for (i = 0; i < ln; ++i) {
                internalName = cachedInitList[i].getInternalName(prototype);
                // Since these are cached configs the base class will potentially have put
                // its cached values on the prototype so we need to hide these while we
                // run the inits for our cached configs.
                instance[internalName] = null;
            }

            for (i = 0; i < ln; ++i) {
                names = (cfg = cachedInitList[i]).names;
                getter = names.get;

                if (instance.hasOwnProperty(getter)) {
                    instance[names.set](values[cfg.name]);
                    delete instance[getter];
                }
            }

            for (i = 0; i < ln; ++i) {
                internalName = cachedInitList[i].getInternalName(prototype);
                prototype[internalName] = instance[internalName];
                delete instance[internalName];
            }

            // The cachedConfigs have all been set to the default values including any of
            // those that may have been triggered by their getter.
        }

        // If the instanceConfig has a platformConfig in it, we need to merge the active
        // rules of that object to make the actual instanceConfig.
        if (instanceConfig && instanceConfig.platformConfig) {
            instanceConfig = me.resolvePlatformConfig(instance, instanceConfig);
        }

        if (firstInstance) {
            // Allow the class to do things once the cachedConfig has been processed.
            // We need to call this method always when the first instance is configured
            // whether or not it actually has cached configs
            if (instance.afterCachedConfig && !instance.afterCachedConfig.$nullFn) {
                instance.afterCachedConfig(instanceConfig);
            }
        }

        // Now that the cachedConfigs have been processed we can apply the instanceConfig
        // and hide the "configs" on the prototype. This will serve as the source for any
        // configs that need to initialize from their initial getter call.
        // IMPORTANT: "this.hasOwnProperty('config')" is how a config applier/updater can
        // tell it is processing the cached config value vs an instance config value.
        instance.config = values;

        // There are 2 possibilities here:
        // 1) If it's the first time in this function, we may have had cachedConfigs running.
        //    these configs may have called the getters for any of the normal getters, which
        //    means the initial getters have been clobbered on the instance and won't be able
        //    to be called below when we iterate over the initList. As such, we need to
        //    reinitialize them here, even though we've done it up above.
        //
        // 2) If this the second time in this function, the cachedConfigs won't be processed,
        //    so we don't need to worry about them clobbering config values. However, since
        //    we've already done all our setup, we won't enter into the block that sets the
        //    initGetter, so we need to do it here anyway.
        //
        // Also note, that lazy configs will appear in the initList because we need
        // to spin up the initGetter.

        for (i = 0, ln = initList.length; i < ln; ++i) {
            cfg = initList[i];
            instance[cfg.names.get] = cfg.initGetter || cfg.getInitGetter();
        }

        // Give the class a chance to transform the configs. These are stored on the class
        // as a sorted array after the first instance is created. Prior to that, these are
        // stored as a prototype chained object on the class prototype. This allows the
        // transforms to be registered at any time during class load so long as they are
        // all loaded before instances are created.
        if (!(transforms = instance.self.$configTransforms)) {
            instance.self.$configTransforms = transforms = [];
            ln = instance.$configTransforms;

            for (name in ln) {
                transforms.push([ name, ln[name] ]);
            }

            ln = transforms.length;

            if (ln > 1) {
                transforms.sort(me.transformSorter);

                for (i = 0; i < ln; ++i) {
                    transforms[i] = transforms[i][0];
                }
            }
            else if (ln) {
                transforms[0] = transforms[0][0];
            }
        }

        for (i = 0; i < transforms.length; ++i) {
            name = transforms[i];

            if (instance[name]) {
                instanceConfig = instance[name](instanceConfig, me);
            }
        }

        // Important: We are looping here twice on purpose. This first loop serves 2 purposes:
        //
        // 1) Ensure the values collection is fully populated before we call any setters. Since
        // a setter may have an updater/applier, it could potentially call another getter() to grab
        // the value for some other property, so this ensures they are all set on the config object.
        //
        // 2) Ensure that the initGetter is set as the getter for any config that doesn't appear in
        // the initList. We need to ensure that the initGetter is pushed on for everything that
        // we will be setting during init time.
        //
        // The merging in this loop cannot be completed by Ext.merge(), since we do NOT want
        // to merge non-strict values, they should always just be assigned across without
        // modification.
        if (instanceConfig) {
            for (name in instanceConfig) {
                value = instanceConfig[name];
                cfg = configs[name];

                //<debug>
                if (deprecations[name]) {
                    Ext.log.warn(deprecations[name]);

                    if (!cfg) {
                        // If there is a Config for this, perhaps the class is emulating
                        // the old config... If there is not a Config we don't want to
                        // proceed and put the property on the instance. That will likely
                        // hide the bug during development.
                        continue;
                    }
                }
                //</debug>

                if (!cfg) {
                    //<debug>
                    field = instance.self.prototype[name];

                    if (instance.$configStrict && (typeof field === 'function') && !field.$nullFn) {
                        // In strict mode you cannot override functions
                        Ext.raise('Cannot override method ' + name + ' on ' + instance.$className +
                                  ' instance.');
                    }
                    //</debug>

                    // Not all "configs" use the config system so in this case simply put
                    // the value on the instance:
                    instance[name] = value;
                }
                else {
                    // However we still need to create the initial value that needs
                    // to be used. We also need to spin up the initGetter.
                    if (!cfg.lazy) {
                        ++remaining;
                    }

                    if (!initListMap[name]) {
                        instance[cfg.names.get] = cfg.initGetter || cfg.getInitGetter();
                    }

                    valuesKey = values[name];

                    if (cfg.merge) {
                        value = cfg.merge(value, valuesKey, instance);
                    }
                    else if (value && value.constructor === Object) {
                        if (valuesKey && valuesKey.constructor === Object) {
                            value = Ext.merge(values[name], value);
                        }
                        else {
                            value = Ext.clone(value, false);
                        }
                    }
                }

                values[name] = value;
            }
        }

        // Give the class a chance to hook in prior to initializing the configs.
        if (instance.beforeInitConfig && !instance.beforeInitConfig.$nullFn) {
            if (instance.beforeInitConfig(instanceConfig) === false) {
                return;
            }
        }

        if (instanceConfig) {
            for (name in instanceConfig) {
                if (!remaining) {
                    // For classes that have few proper Config properties, this saves us
                    // from making the full 2 passes over the instanceConfig.
                    break;
                }

                // We can ignore deprecated configs here because we warned about them
                // above. Further, since we only process proper Config's here we would
                // not be skipping them anyway.
                cfg = configs[name];

                if (cfg && !cfg.lazy) {
                    --remaining;
                    // A proper "config" property so call the setter to set the value.
                    names = cfg.names;
                    getter = names.get;

                    // At this point the initGetter may have already been called and
                    // cleared if the getter was called from the applier or updater of a
                    // previously processed instance config. checking if the instance has
                    // its own getter ensures the setter does not get called twice.
                    if (instance.hasOwnProperty(getter)) {
                        instance[names.set](values[name]);

                        // The generated setter will remove the initGetter from the instance
                        // but the user may have provided their own setter so we have to do
                        // this here as well:
                        delete instance[names.get];
                    }
                }
            }
        }

        // Process configs declared on the class that need per-instance initialization.
        for (i = 0, ln = initList.length; i < ln; ++i) {
            cfg = initList[i];
            names = cfg.names;
            getter = names.get;

            if (!cfg.lazy && instance.hasOwnProperty(getter)) {
                // Since the instance still hasOwn the getter, that means we've set an initGetter
                // and it hasn't been cleared by calling any setter. Since we've never set the value
                // because it wasn't passed in the instance, we go and set it here, taking the value
                // from our definition config and passing it through finally clear off the getter.
                instance[names.set](values[cfg.name]);
                delete instance[getter];
            }
        }

        // Expose the value from the prototype chain (false):
        delete instance.isConfiguring;
    },

    getCurrentConfig: function(instance) {
        var defaultConfig = instance.defaultConfig,
            config = {},
            name;

        for (name in defaultConfig) {
            config[name] = instance[configPropMap[name].names.get]();
        }

        return config;
    },

    /**
     * This method is called to update the internal state of a given config when that
     * config is needed in a config transform (such as responsive or stateful mixins).
     *
     * @param {Ext.Base} instance The instance to configure.
     * @param {Object} instanceConfig The config for the instance.
     * @param {String[]} names The name(s) of the config(s) to process.
     * @private
     * @since 6.7.0
     */
    hoistConfigs: function(instance, instanceConfig, names) {
        var config = instance.config,
            configs = this.configs,
            initListMap = this.initListMap,
            ret = false,
            cfg, i, name;

        for (i = 0; i < names.length; ++i) {
            name = names[i];

            if (instanceConfig && name in instanceConfig) {
                cfg = configs[name]; // the Ext.Config instance

                config[name] = cfg.combine(instanceConfig[name], config[name], instance);

                if (!initListMap[name]) {
                    instance[cfg.names.get] = cfg.initGetter || cfg.getInitGetter();
                }
            }

            // The config could be defined on the class, so may be present even if
            // not in instance config.
            if (config[name] != null) {
                ret = true;
            }
        }

        return ret;
    },

    /**
     * Merges the values of a config object onto a base config.
     * @param {Ext.Base} instance
     * @param {Object} baseConfig
     * @param {Object} config
     * @param {Boolean} [clone=false]
     * @return {Object} the merged config
     * @private
     */
    merge: function(instance, baseConfig, config, clone) {
        // Although this is a "private" method.  It is used by Sencha Architect and so
        // its api should remain stable.
        var configs = this.configs,
            name, value, baseValue, cfg;

        if (clone) {
            baseConfig = Ext.clone(baseConfig, /* cloneDom= */false);
        }

        for (name in config) {
            value = config[name];
            cfg = configs[name];

            if (cfg) {
                baseValue = baseConfig[name];

                if (cfg.merge) {
                    value = cfg.merge(value, baseValue, instance);
                }
                else if (value && value.constructor === Object) {
                    if (baseValue && baseValue.constructor === Object) {
                        value = Ext.merge(baseValue, value);
                    }
                    else {
                        value = Ext.clone(value, false);
                    }
                }
            }

            baseConfig[name] = value;
        }

        return baseConfig;
    },

    /**
     * @private
     */
    reconfigure: function(instance, instanceConfig, options) {
        var currentConfig = instance.config,
            configList = [],
            strict = instance.$configStrict && !(options && options.strict === false),
            configs = this.configs,
            defaults = options && options.defaults,
            cfg, getter, i, len, name, names, prop;

        for (name in instanceConfig) {
            cfg = configs[name];

            /* eslint-disable-next-line max-len */
            if (defaults && instance.hasOwnProperty(cfg && instance.$configPrefixed ? cfg.names.internal : name)) {
                continue;
            }

            currentConfig[name] = instanceConfig[name];

            //<debug>
            if (this.deprecations[name]) {
                // See similar logic doc in configure() method.
                Ext.log.warn(this.deprecations[name]);

                if (!cfg) {
                    continue;
                }
            }
            //</debug>

            if (cfg) {
                // To ensure that configs being set here get processed in the proper order
                // we must give them init getters just in case they depend upon each other
                instance[cfg.names.get] = cfg.initGetter || cfg.getInitGetter();
            }
            else {
                // Check for existence of the property on the prototype before proceeding.
                // If present on the prototype, and if the property is a function we
                // do not allow it to be overridden by a property in the config object
                // in strict mode (unless the function on the prototype is a emptyFn or
                // identityFn).  Note that we always check the prototype, not the instance
                // because calling setConfig a second time should have the same results -
                // the first call may have set a function on the instance.
                prop = instance.self.prototype[name];

                if (strict) {
                    if ((typeof prop === 'function') && !prop.$nullFn) {
                        //<debug>
                        Ext.Error.raise("Cannot override method " + name + " on " +
                                        instance.$className + " instance.");
                        //</debug>

                        continue;
                    }
                    //<debug>
                    else {
                        if (name !== 'type' && name !== 'xtype') {
                            Ext.log.warn('No such config "' + name + '" for class ' +
                                instance.$className);
                        }
                    }
                    //</debug>
                }
            }

            configList.push(name);
        }

        for (i = 0, len = configList.length; i < len; i++) {
            name = configList[i];
            cfg = configs[name];

            if (cfg) {
                names = cfg.names;
                getter = names.get;

                if (instance.hasOwnProperty(getter)) {
                    // Since the instance still hasOwn the getter, that means we've set
                    // an initGetter and it hasn't been cleared by calling any setter.
                    // Since we've never set the value because it wasn't passed in the instance,
                    // we go and set it here, taking the value from our definition config
                    // and passing it through finally clear off the getter.
                    instance[names.set](instanceConfig[name]);

                    delete instance[getter];
                }
            }
            else {
                cfg = configPropMap[name] || Ext.Config.get(name);
                names = cfg.names;

                if (instance[names.set]) {
                    instance[names.set](instanceConfig[name]);
                }
                else {
                    // apply non-config props directly to the instance
                    instance[name] = instanceConfig[name];
                }
            }
        }
    },

    /**
     * This method accepts an instance config object containing a `platformConfig`
     * property and merges the appropriate rules from that sub-object with the root object
     * to create the final config object that should be used. This is method called by
     * `{@link #configure}` when it receives an `instanceConfig` containing a
     * `platformConfig` property.
     *
     * @param {Ext.Base} instance
     * @param {Object} instanceConfig The instance config parameter.
     * @return {Object} The new instance config object with platformConfig results applied.
     * @private
     * @since 5.1.0
     */
    resolvePlatformConfig: function(instance, instanceConfig) {
        var platformConfig = instanceConfig && instanceConfig.platformConfig,
            ret = instanceConfig,
            i, keys, n;

        if (platformConfig) {
            keys = Ext.getPlatformConfigKeys(platformConfig);
            n = keys.length;

            if (n) {
                ret = Ext.merge({}, ret); // this deep copies sub-objects

                for (i = 0, n = keys.length; i < n; ++i) {
                    this.merge(instance, ret, platformConfig[keys[i]]);
                }
            }
        }

        return ret;
    },

    transformSorter: function(a, b) {
        return a[1] - b[1];
    }
}; // prototype

}()); // closure on whole file
