let app = {};

let init = app => {
    app.data = {
        id: -1,
        extended: false,
        timeslots: [],
        schedules: [],
        members: [],
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


    app.methods = {
        toggle_extended: app.toggle_extended,

    };

    app.vue = new Vue({
        el: "#vue-target",
        data: app.data,
        methods: app.methods
    });

    app.init = () => {
        // Initialize times of day
        app.vue.timeslots = ([...Array(28).keys()].map(i=>i+16));

        // Initialize cells
        app.vue.cells = Array(48).fill().map(() => Array(7).fill([]));

        // Load users and their schedules
        axios.get(load_group_url).then(function(res) {
            app.vue.id = res.data.group_id;
            for (let member of res.data.member_schedules) {
                app.vue.members.push({
                    id: member[0], 
                    first_name: member[1], 
                    last_name: member[2]
                });

                let schedule = member[3];
                if (schedule.length > 0) {
                    schedule = JSON.parse(schedule.replace(/'/g, '"'));
                    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    for (let [day, times] of Object.entries(schedule)) {
                        let day_idx = days.findIndex(d => d==day);
                        for (let time of times) {
                            Vue.set(app.vue.cells[time], day_idx, app.vue.cells[time][day_idx] + member[0])
                        }
                    }

                } else schedule = {};
                app.vue.schedules.push({
                    member_id: member[0],
                    schedule: schedule
                });
            }
        })

    }

    app.init();
}

init(app);