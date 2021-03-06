let app = {};

let init = app => {
    app.data = {
        // 0: Left click; 2: Right Click
        mousedown: -1,
        extended: false,
        timeslots: [],
        adding: false,
        deleting: false,
        cells: [],
        // 1: free; -1: busy
        displayMode: 1,
        saved: false,
        clear_prompt: false
    };

    /**
     * Toggle extended schedule table
     */
    app.toggle_extended = function() {
        app.vue.timeslots = app.vue.extended ?
                            [...Array(48).keys()] :
                            ([...Array(28).keys()].map(i=>i+16));
    };

    /**
     * Change displayMode to selected mode, then flip cell values
     */
    app.select_mode = function(mode) {
        if (app.vue.displayMode == mode) return;
        app.vue.cells = app.vue.cells.map(r=>r.map(c=>c=!c));
        app.vue.displayMode*=-1;
    }

    app.set_clear_prompt = function(val) {
        app.vue.clear_prompt = val;
    }

    /**
     * Called when mouse enters a table cell
     * Decides if schedule should be added or deleted
     * If click was started in empty cell, drag to add cells
     * If click was started in filled cell, drag to clear cells
     */
    app.schedule_enter = function(row, col, click) {
        if (app.vue.mousedown==0 || click) {
            // Initial click
            if (!app.vue.adding && !app.vue.deleting) {
                if (!app.vue.cells[row][col]) app.vue.adding=true;
                else app.vue.deleting=true;
            }
            if (app.vue.adding) {
                Vue.set(app.vue.cells[row], col, true);
            }
            if (app.vue.deleting) {
                Vue.set(app.vue.cells[row], col, false);
            }
            app.vue.saved = false;
        } 

    };

    app.schedule_clear = function() {
        axios.get(clear_schedule_url).then(function(res) {
            app.vue.cells = Array(48).fill().map(() => Array(7).fill(false));
        });
        app.vue.clear_prompt = false;
    };

    app.schedule_save = function() {
        // Skip if already saved without any other changes
        if (app.vue.saved) return;

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const ROW_CNT = 48;

        // Filter out blank cells
        let nonsparse = [];
        for (col=0; col<days.length; ++col) {
            nonsparse.push([]);
            for (row=0; row<ROW_CNT; ++row) {
                if ((!app.vue.cells[row][col] && app.vue.displayMode==-1) ||
                     (app.vue.cells[row][col] && app.vue.displayMode== 1)) {
                    nonsparse[col].push(row);
                }
            }
        }
        
        // Fill json with nonsparse data
        let json = {};
        for (day=0; day<days.length; ++day) {
            if (nonsparse[day].length > 0) {
                json[days[day]] = [];
                for (let entry of nonsparse[day]) {
                    json[days[day]].push(entry);
                }
            }
        }   

        axios.post(save_schedule_url, {
            schedule: json
        }).then(function(res) {
            app.vue.saved = true;
        });
    };

    app.methods = {
        toggle_extended: app.toggle_extended,
        select_mode: app.select_mode,
        set_clear_prompt: app.set_clear_prompt,
        schedule_enter: app.schedule_enter,
        schedule_clear: app.schedule_clear,
        schedule_save: app.schedule_save,
    };

    app.vue = new Vue({
        el: "#vue-target",
        data: app.data,
        methods: app.methods
    });

    app.init = () => {
        // Prevent highlighting when dragging in table
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

        // range(8, 21); Loads times on left
        app.vue.timeslots = ([...Array(28).keys()].map(i=>i+16));

        // Load cells
        // https://stackoverflow.com/questions/3689903/how-to-create-a-2d-array-of-zeroes-in-javascript
        app.vue.cells = Array(48).fill().map(() => Array(7).fill(false));

        // Load schedule
        axios.get(load_schedule_url).then(function(res) {
            let schedule = res.data.schedule.replace(/'/g, '"');
            if (schedule.length > 0) {
                schedule = JSON.parse(schedule);
                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

                // Determine schedule from JSON
                for (let [day, times] of Object.entries(schedule)) {
                    let day_idx = days.findIndex(d => d==day);
                    for (let time of times) {
                        Vue.set(app.vue.cells[time], day_idx, true);
                    }
                }
            }

        });
    };

    app.init();
}

init(app);