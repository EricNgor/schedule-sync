let app = {};

let init = app => {
    app.data = {
        status: false,
        // 0: Left click; 2: Right Click
        mousedown: -1,
        extended: false,
        timeslots: [],
        adding: false,
        deleting: false,
        cells: [],
    };

    /**
     * Toggle extended schedule table
     */
    app.toggle_extended = function() {
        app.vue.timeslots = app.vue.extended ?
                            [...Array(48).keys()] :
                            ([...Array(28).keys()].map(i=>i+16));
    }

    /**
     * Called when mouse enters a table cell
     * Decides if schedule should be added or deleted
     */
    app.schedule_enter = function(row, col, click) {
        if (app.vue.mousedown==0 || click) {
            // console.log('entered with mouse down');
            // Initial click
            if (!app.vue.adding && !app.vue.deleting) {
                // console.log('initial clicking w/ (add, delete):', app.vue.adding, app.vue.deleting);
                if (!app.vue.cells[row][col]) app.vue.adding=true;
                else app.vue.deleting=true;
            }
            if (app.vue.adding) {
                app.schedule_add(row, col);
            }
            if (app.vue.deleting) {
                app.schedule_delete(row, col);
            }
        } 

    }

    // If click was started in empty cell, 
    // dragging mouse to other empty cells selects them
    // Else if click was started in selected cell, 
    // dragging mouse to other selected cells deselects them
    app.schedule_add = function(row, col) {
        Vue.set(app.vue.cells[row], col, true);
    };

    app.schedule_delete = function(row, col) {
        Vue.set(app.vue.cells[row], col, false);
    }

    app.schedule_clear = function() {
        app.vue.cells = Array(48).fill().map(() => Array(7).fill(false));
        // clear schedule from db
    }

    app.schedule_save = function() {
        // save
        
    }

    app.methods = {
        toggle_extended: app.toggle_extended,
        schedule_enter: app.schedule_enter,
        schedule_add: app.schedule_add,
        schedule_delete: app.schedule_delete,
        schedule_clear: app.schedule_clear,
        schedule_save: app.schedule_save,
    };

    app.vue = new Vue({
        el: "#vue-target",
        data: app.data,
        methods: app.methods
    });

    app.init = () => {
        addEventListener("selectstart", e => {
            const el = e.path[1].localName;
            if (el=='th' || el=='td' || el=="tr" || el=="label") {
                e.preventDefault();
            }
        });
        addEventListener("mousedown", e => {
            app.vue.mousedown = e.button;
        });

        addEventListener("mouseup", e => {
            app.vue.mousedown = -1;
            app.vue.adding = false;
            app.vue.deleting = false;
        });


        // range(8, 21); loads times on left
        // app.vue.timeslots = ([...Array(14).keys()].map(i=>i+8));
        app.vue.timeslots = ([...Array(28).keys()].map(i=>i+16));

        // Load cells
        // https://stackoverflow.com/questions/3689903/how-to-create-a-2d-array-of-zeroes-in-javascript
        app.vue.cells = Array(48).fill().map(() => Array(7).fill(false));

        // Load schedule
        axios.get(load_schedule_url).then(function(res) {
            let schedule = res.data.schedule;
            console.log('schedule:', schedule);
        });
    };

    app.init();
}

init(app);