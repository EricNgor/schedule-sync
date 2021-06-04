let app = {};

let init = app => {
    app.data = {
        id: -1,
        extended: false,
        timeslots: [],
        // {member_id, schedule: {day: [time]}}
        schedules: [],
        // {id, first_name, last_name, included}
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

    /**
     * Count the number of group members busy at this time, then return
     * a style accordingly
     * is-none -- 0% -- is-danger -- 50% -- is-warning -- 100% -- is-success
     */
    app.count_overlap = function(row, col) {
        const cnt_members = app.vue.members.filter(e => e.included).length;
        const cnt_overlap = app.vue.cells[row][col].length;
        if (cnt_overlap == 0) return 'is-none';

        const overlap_perc = cnt_overlap / cnt_members;

        if (overlap_perc == 1) return 'is-success';
        if (overlap_perc >= 0.5) return 'is-warning';
        return 'is-danger';
    }

    /**
     * Toggle a member's inclusion into the current group view
     */
    app.toggle_member = function(member) {
        if (member.included) {
            app.exclude_member(member);
        } else {
            app.include_member(member);
        }
    };

    app.include_member = function(member) {
        let schedule = app.vue.schedules.find(e=>e.member_id==member.id).schedule;
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        for (let [day, times] of Object.entries(schedule)) {
            let day_idx = days.findIndex(d => d==day);
            for (let time of times) {
                Vue.set(app.vue.cells[time], day_idx, [...app.vue.cells[time][day_idx], member.id]);
            }
        }
        member.included = true;
    };

    app.exclude_member = function(member) {
        const ROW_CNT = 48;
        for (let col=0; col < 7; ++col) {
            for (let row=0; row < ROW_CNT; ++row) {
                if (app.vue.cells[row][col].length==0) continue;
                Vue.set(
                    app.vue.cells[row], 
                    col, 
                    app.vue.cells[row][col].filter(e=>e != member.id)
                )
            }
        }
        member.included = false;
    };

    app.include_all = function() {
        for (let member of app.vue.members) {
            if (!member.included) app.include_member(member);
        }
    };

    app.exclude_all = function() {
        for (let member of app.vue.members) {
            if (member.included) app.exclude_member(member);
        }
    };

    app.methods = {
        toggle_extended: app.toggle_extended,
        count_overlap: app.count_overlap,
        toggle_member: app.toggle_member,
        include_member: app.include_member,
        exclude_member: app.exclude_member,
        include_all: app.include_all,
        exclude_all: app.exclude_all,
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
                    last_name: member[2],
                    included: true
                });

                let schedule = member[3];
                if (schedule.length > 0) {
                    schedule = JSON.parse(schedule.replace(/'/g, '"'));
                    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    for (let [day, times] of Object.entries(schedule)) {
                        let day_idx = days.findIndex(d => d==day);
                        for (let time of times) {
                            Vue.set(app.vue.cells[time], day_idx, [...app.vue.cells[time][day_idx], member[0]]);
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