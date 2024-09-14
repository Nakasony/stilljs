class ComponentRegistror {

    componentList = {};
    static registror = null;

    static get(){

        if(ComponentRegistror.registror == null){
            ComponentRegistror.registror = new ComponentRegistror();
        }
        return ComponentRegistror.registror;

    }

    /**
     * 
     * @param {SettingType} component 
     */
    export({ componentName: name, path, instance }){
        if(!(name in this.componentList))
            this.componentList[instance.componentName] = { path, instance };

    }

    /**
     * 
     * @param {ViewComponent} cmp 
     */
    expose(cmp){
        return new Components().getParsedComponent(cmp);
    }

    getComponent(name){
        return this.componentList[name].instance;
    }
}

const $still = {
    context: {
        componentRegistror: ComponentRegistror.get(),
        componentMap: routesMap.viewRoutes,
        currentView: null,
    },
    component: {
        /** @param { ViewComponent } cmp */
        expose: (cmp) => {
            return ComponentRegistror.get().expose(cmp)
        },
        list: window
    },
    HTTPClient: new StillHTTPClient(),
}
