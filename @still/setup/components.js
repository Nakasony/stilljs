const loadComponentFromPath = (path, className, callback = () => {}) => {
    
    return new Promise((resolve, reject) => {

        if(className in $still.component.list){
            resolve({ imported: true });
            return false;
        }

        try {
            eval(`${className}`);
            resolve([])
        } catch (error) {
            
            console.log(`Loading the component for the first time: `,className);

            const script = document.createElement('script');
            script.src = `${path}/${className}.js`;
            document.head.appendChild(script);
    
            const lazyLoadCompTimer = setInterval(() => {
                try{
                    resolve([]);
                    clearInterval(lazyLoadCompTimer);
                }catch(err){
                    console.error(`Error on lazy loading component: ${className} `, err);
                }
            }, 500);

        }

    });

}

const getPjsComponents = () => {
    return document.querySelectorAll('.pjs-app-component');
}

const getPjsComponentsFrom = (cmp) => {
    return cmp.querySelectorAll('.pjs-app-component');
}

const loadTemplate = async (path, placeHolder) => {
    try{
        return (await fetch(`${path}/template.html`)).text();
    }catch(err){
        console.error(`Error loading visual component part for ${placeHolder}`);
        return false;
    }
}

class LoadedComponent {
    /**
     * @type {Array<string>}
     */
    cpmImports;

    /**
     * @type {HTMLElement}
     */
    cmp;
}

class Components {

    /**
     * @returns {{template, }}
     */
    init(){}
    template;
    entryComponentPath;
    entryComponentName;
    /** @type { ViewComponent } */
    component;
    componentName;

    renderOnViewFor(placeHolder){
        if(this.template instanceof Array)
            this.template = this.template.join('');
        
        document
            .getElementById(placeHolder)
            .innerHTML = this.template;
    }

    /**
     * 
     * @param {HTMLElement} cmp 
     * @returns { LoadedComponent }
     */
    async loadComponentDEPRECATE(cmp){
        try {
            
            const { tagName } = cmp;
            const htmlElm = String(tagName).toLowerCase();
            const { path, name: cmpName } = context.componentMap[htmlElm];
            const content = await loadTemplate(path, cmpName);
            if(cmp){
                if(!content){
                    throw new Error(`Error loading visual component part for ${tagName}`);
                }
                cmp.innerHTML = content;
            }
            
            const cpmImports = await loadComponentFromPath(path,cmpName);
            return {cpmImports, cmp};
    
        } catch (error) {
            console.error(`Error on tgemplate load: `,error);
        }
    }

    async loadComponent(){
        loadComponentFromPath(
            this.entryComponentPath,
            this.entryComponentName
        ).then(async () => {
            /**
             * @type { ViewComponent }
             */
            $still.context.currentView = this.init();
            const init = $still.context.currentView;
            //window[this.entryComponentName] = init;
            this.template = init.template;
            this.renderOnViewFor('appPlaceholder');
        });
    }

    setComponentAndName(cmp, cmpName){
        this.component = cmp;
        this.componentName = cmpName;
        return this;
    }

    /** 
     * @param {ViewComponent} cmp 
     */    
    defineSetter = (cmp, field) => {

        cmp.__defineGetter__(field, () => {
            return { 
                value: cmp['_'+field],
                onChange: (callback = function(){}) => {
                    cmp.subscribers.push(callback);
                }
            };
        });

    }

    /** 
     * @param {ViewComponent} cmp 
     */
    parseGetsAndSets(){

        const cmp = this.component;
        const cmpName = this.componentName;

        cmp.getProperties().forEach(field => {
            
            Object.assign(cmp, { ['_'+field]: cmp[field] });
            Object.assign(cmp, { subscribers: [] });

            this.defineSetter(cmp, field);

            cmp.__defineSetter__(field, (newValue) => {
                
                cmp.__defineGetter__(field, () => newValue);
                cmp['_'+field] = newValue;
                this.defineSetter(cmp, field);
                cmp.stOnUpdate();

                setTimeout(() => cmp.subscribers.forEach(
                    subscriber => subscriber(cmp['_'+field])
                ));
            });

        });

        return this;
    }

    /** @param {ViewComponent} cmp */
    defineNewInstanceMethod(){

        const cmp = this.component;
        const cmpName = this.componentName;
        Object.assign(cmp, {
            new: (params) => {

                if(params instanceof Object)
                    return eval(`new ${cmpName}({...${JSON.stringify(params)}})`);

                if(params instanceof Array)
                    return eval(`new ${cmpName}([...${JSON.stringify(params)}])`);
                
                return eval(`new ${cmpName}('${params}')`);
            }
        });
        return this;
    }
    
    /**  @param {ViewComponent} cmp */
    getParsedComponent(cmp){

        const componentName = cmp.getName().replace('C','');
        window[componentName] = cmp;
        const parsing = this
        .setComponentAndName(window[componentName], cmp.getName())
        .defineNewInstanceMethod();

        setTimeout(() => {
            parsing.parseGetsAndSets();
        });
        
        return window[componentName];

    }

}